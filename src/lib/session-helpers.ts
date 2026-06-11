import { backendFetch } from "@/lib/api-fetch";
import { schoolNowMinutes, schoolToday, timeToMinutes } from "@/lib/school-time";
import { fetchTeacherClassrooms, type ClassroomSummary } from "@/lib/classroom-helpers";

export interface SessionSummary {
  id: number | null;
  classroomId?: number | null;
  classroomName?: string | null;
  subjectName?: string | null;
  teacherName?: string | null;
  sessionDate: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string | null;
  substituteTeacherId?: number | null;
  substituteTeacherName?: string | null;
  substituteReason?: string | null;
  earlyCheckinMinutes?: number | null;
}

interface ScheduleSummary {
  id: number;
  classId?: number | null;
  className: string;
  subjectName?: string | null;
  teacherName?: string | null;
  dayOfWeek: string;
  startTime: string | null;
  endTime: string | null;
  status: boolean;
  attendanceRequired?: boolean | null;
}

export interface TeacherClassroomView extends ClassroomSummary {
  activeSession?: SessionSummary | null;
}

function pageContent<T>(json: unknown): T[] {
  const payload = (json as { payload?: { content?: T[] } | T[] })?.payload;
  if (Array.isArray(payload)) return payload;
  return payload?.content ?? [];
}

function sessionSort(a: Pick<SessionSummary, "startTime">, b: Pick<SessionSummary, "startTime">) {
  return (a.startTime ?? "").localeCompare(b.startTime ?? "");
}

function isOpenableStatus(status?: string | null) {
  return status === "UPCOMING" || status === "SCHEDULED";
}

export function isTeacherStartableSession(session: Pick<SessionSummary, "status" | "startTime" | "earlyCheckinMinutes">) {
  if (session.status === "ACTIVE") return true;
  if (!isOpenableStatus(session.status)) return false;
  const start = timeToMinutes(session.startTime);
  if (start == null) return false;
  const now = schoolNowMinutes();
  const early = session.earlyCheckinMinutes ?? 15;
  return now >= start - early && now <= start + 15;
}

function isTodayScheduleStartable(schedule: ScheduleSummary) {
  if (!schedule.status || schedule.attendanceRequired === false) return false;
  const today = schoolToday();
  if (schedule.dayOfWeek?.toUpperCase() !== today.weekday) return false;
  const start = timeToMinutes(schedule.startTime);
  if (start == null) return false;
  const now = schoolNowMinutes();
  return now >= start - 15 && now <= start + 15;
}

function scheduleToSession(schedule: ScheduleSummary): SessionSummary {
  const today = schoolToday();
  return {
    id: null,
    classroomId: schedule.classId ?? null,
    classroomName: schedule.className,
    subjectName: schedule.subjectName ?? null,
    teacherName: schedule.teacherName ?? null,
    sessionDate: today.iso,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    status: "UPCOMING",
    earlyCheckinMinutes: 15,
  };
}

function chooseBestSession(sessions: SessionSummary[]) {
  const sorted = [...sessions].sort(sessionSort);
  return (
    sorted.find((session) => session.status === "ACTIVE") ??
    sorted.find(isTeacherStartableSession) ??
    sorted.find((session) => isOpenableStatus(session.status)) ??
    sorted.find((session) => session.status !== "CANCELLED") ??
    null
  );
}

export async function fetchTodaySessionForClassroom(classroomId: string): Promise<SessionSummary | null> {
  const today = schoolToday();
  try {
    await backendFetch(`/sessions/classrooms/${classroomId}/ensure-today`, { method: "POST" });
    const sessionRes = await backendFetch(
      `/sessions/classrooms/${classroomId}?from=${today.iso}&to=${today.iso}&page=0&size=20`
    );
    if (sessionRes.ok) {
      const sessions = pageContent<SessionSummary>(await sessionRes.json());
      const best = chooseBestSession(sessions);
      if (best) return best;
    }
  } catch {
    // Fall through to the schedule fallback below.
  }

  try {
    const scheduleRes = await backendFetch(`/schedules/classrooms/${classroomId}?size=50`);
    if (!scheduleRes.ok) return null;
    const schedules = pageContent<ScheduleSummary>(await scheduleRes.json())
      .filter((schedule) =>
        schedule.status &&
        schedule.attendanceRequired !== false &&
        schedule.dayOfWeek?.toUpperCase() === today.weekday
      )
      .sort(sessionSort);
    return schedules[0] ? scheduleToSession(schedules[0]) : null;
  } catch {
    return null;
  }
}

export async function fetchTeacherActiveClassrooms(
  teacherId: string,
  allClassrooms?: ClassroomSummary[],
): Promise<TeacherClassroomView[]> {
  const today = schoolToday();
  const classrooms = allClassrooms ?? await fetchTeacherClassrooms(teacherId, 200);
  const classByName = new Map(classrooms.map((classroom) => [classroom.className, classroom]));
  const activeByName = new Map<string, SessionSummary>();

  try {
    const sessionRes = await backendFetch(
      `/sessions/teachers/${teacherId}?from=${today.iso}&to=${today.iso}&page=0&size=200`
    );
    if (sessionRes.ok) {
      for (const session of pageContent<SessionSummary>(await sessionRes.json())) {
        if (session.classroomName && isTeacherStartableSession(session)) {
          activeByName.set(session.classroomName, session);
        }
      }
    }
  } catch {
    // Schedule fallback below still gives regular teacher classes.
  }

  try {
    const scheduleRes = await backendFetch(`/schedules/teachers/${teacherId}?size=200`);
    if (scheduleRes.ok) {
      for (const schedule of pageContent<ScheduleSummary>(await scheduleRes.json())) {
        if (schedule.className && isTodayScheduleStartable(schedule) && !activeByName.has(schedule.className)) {
          activeByName.set(schedule.className, scheduleToSession(schedule));
        }
      }
    }
  } catch {
    // Keep any session-backed active classes already found.
  }

  const activeClassrooms: TeacherClassroomView[] = [];
  for (const [className, activeSession] of activeByName.entries()) {
    const classroom = classByName.get(className);
    if (classroom) activeClassrooms.push({ ...classroom, activeSession });
  }
  return activeClassrooms;
}
