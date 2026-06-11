import { backendFetch } from "@/lib/api-fetch";

export interface ClassroomSummary {
  id: number;
  className: string;
  classCode: string;
  programTypeName: string;
  generation: number;
  year: number | null;
  semester: number | null;
  shift: string;
  academicYear: number;
  startDate: string;
  endDate: string;
  /** Lab/room name, e.g. "Lab DevOps", "Lab AI", "Lab Data Analytics". */
  lab?: string | null;
  status: boolean;
}

interface ScheduleSummary {
  className: string;
}

interface TeacherSession {
  classroomName: string;
  substituteTeacherId: number | null;
}

interface StudentSummary {
  className?: string;
  gender?: string;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function fetchAllClassrooms(size = 200): Promise<ClassroomSummary[]> {
  try {
    const res = await backendFetch(`/classrooms?size=${size}`);
    if (!res.ok) return [];
    return (await res.json())?.payload?.content ?? [];
  } catch {
    return [];
  }
}

/** Real per-class headcounts (total / female), keyed by className. */
export async function fetchClassCounts(): Promise<Record<string, { total: number; female: number }>> {
  try {
    const res = await backendFetch(`/users/students?size=2000`);
    if (!res.ok) return {};
    const students: StudentSummary[] = (await res.json())?.payload?.content ?? [];
    const counts: Record<string, { total: number; female: number }> = {};
    for (const s of students) {
      if (!s.className) continue;
      const entry = (counts[s.className] ??= { total: 0, female: 0 });
      entry.total += 1;
      if (s.gender?.toUpperCase().startsWith("F")) entry.female += 1;
    }
    return counts;
  } catch {
    return {};
  }
}

/**
 * A teacher's "My Classes" = classes on their regular weekly schedule, PLUS
 * any class where an admin assigned them as a substitute teacher for a
 * specific session (the substitute also sees that class here).
 */
export async function fetchTeacherClassrooms(teacherId: string, size = 200): Promise<ClassroomSummary[]> {
  try {
    const today = new Date();
    const from = new Date(today); from.setDate(from.getDate() - 7);
    const to   = new Date(today); to.setDate(to.getDate() + 30);

    const [schedRes, clsRes, sessRes] = await Promise.all([
      backendFetch(`/schedules/teachers/${teacherId}?size=${size}`),
      backendFetch(`/classrooms?size=${size}`),
      backendFetch(`/sessions/teachers/${teacherId}?from=${isoDate(from)}&to=${isoDate(to)}&size=${size}`),
    ]);
    const schedules: ScheduleSummary[] =
      (await schedRes.json())?.payload?.content ?? [];
    const classrooms: ClassroomSummary[] =
      (await clsRes.json())?.payload?.content ?? [];
    const sessions: TeacherSession[] =
      (await sessRes.json())?.payload?.content ?? [];

    const teacherClassNames = new Set(schedules.map((s) => s.className));
    const teacherIdNum = Number(teacherId);
    for (const session of sessions) {
      if (session.substituteTeacherId === teacherIdNum && session.classroomName) {
        teacherClassNames.add(session.classroomName);
      }
    }
    return classrooms.filter((c) => teacherClassNames.has(c.className));
  } catch {
    return [];
  }
}
