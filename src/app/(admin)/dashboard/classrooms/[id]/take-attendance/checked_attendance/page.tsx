import ReportToday from "@/components/table/report_today";
import { AmendmentButton } from "@/components/amendment-button";
import { backendFetch } from "@/lib/api-fetch";
import { fetchTodaySessionForClassroom, type SessionSummary } from "@/lib/session-helpers";
import { AttendanceStatus, type Student } from "@/types/student";

interface Classroom {
  className: string;
  classCode?: string | null;
}

async function fetchClassroom(id: string): Promise<Classroom | null> {
  try {
    const res = await backendFetch(`/classrooms/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.payload ?? null;
  } catch { return null; }
}

async function fetchSessionStatusMap(sessionId: number | null): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!sessionId) return map;
  try {
    const res = await backendFetch(`/attendances/sessions/${sessionId}?size=500`);
    if (!res.ok) return map;
    const json = await res.json();
    const rows = json?.payload?.content ?? json?.payload ?? [];
    if (!Array.isArray(rows)) return map;
    for (const row of rows) {
      const studentId = row?.student?.id ?? row?.studentId;
      const status = row?.status;
      if (studentId != null && typeof status === "string") {
        map.set(String(studentId), status);
      }
    }
  } catch { /* empty map → PENDING */ }
  return map;
}

async function fetchStudents(id: string, statusMap: Map<string, string>): Promise<Student[]> {
  try {
    const res = await backendFetch(`/classrooms/${id}/students?size=500`);
    if (!res.ok) return [];
    const json = await res.json();
    const rows = json?.payload?.content ?? json?.payload ?? [];
    if (!Array.isArray(rows)) return [];

    return rows.map((student) => {
      const idKey = String(student.id ?? student.studentNo ?? "");
      const recordedStatus = statusMap.get(idKey) ?? student.status;
      return {
        id: idKey,
        name: String(student.name ?? student.fullName ?? student.username ?? "—"),
        gender: String(student.gender ?? "—"),
        phone: String(student.phone ?? student.phoneNumber ?? "—"),
        dateOfBirth: String(student.dateOfBirth ?? student.dob ?? "—"),
        profile: String(student.profileImage ?? student.profile ?? "/file.svg"),
        status: recordedStatus
          ? (String(recordedStatus).toLowerCase() as AttendanceStatus)
          : AttendanceStatus.PENDING,
      };
    });
  } catch {
    return [];
  }
}

export default async function CheckedAttendance({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [classroom, session] = await Promise.all([
      fetchClassroom(id),
      fetchTodaySessionForClassroom(id) as Promise<SessionSummary | null>,
    ]);
    const statusMap = await fetchSessionStatusMap(session?.id ?? null);
    const students = await fetchStudents(id, statusMap);
    const femaleStudents = students.filter((student) => {
      const gender = student.gender?.toLowerCase?.() ?? "";
      return gender === "female" || gender === "f";
    }).length;
    return (
        <main className="px-7 py-7">
            <section className="mx-auto mb-2 w-full flex justify-between">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-col">
                  <h1 className="mb-3 text-3xl font-semibold tracking-tight text-black dark:text-white">
                    {classroom?.className ?? "Classroom"}
                  </h1>
                  <h2 className="text-2xl leading-tight text-black dark:text-white">
                    បញ្ជីរាយវត្តមានសិស្ស-Student Attendance List-Today
                  </h2>
                </div>
                </div>
                <div className="flex-col">
                  <AmendmentButton
                    sessionId={session?.id ?? null}
                    students={students.map((s) => ({
                      id: s.id,
                      name: s.name,
                      currentStatus: s.status,
                    }))}
                  />
                </div>
            </section>
            <section>
                <ReportToday
                  students={students}
                  sessionId={session?.id ?? null}
                  sessionDate={session?.sessionDate ?? null}
                  startTime={session?.startTime ?? null}
                  endTime={session?.endTime ?? null}
                  classCode={classroom?.classCode ?? null}
                  totalStudents={students.length}
                  femaleStudents={femaleStudents}
                />
                <aside className="mt-4 max-w-md w-87.5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 my-font dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  <p className="border-b border-slate-200 pb-1 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">Note</p>
                  <ul className="space-y-1 mt-2 pl-3 list-disc">
                    <li className="ml-4">
                      <span className="font-semibold">P</span> stands for Present.
                    </li>
                    <li className="ml-4">
                      <span className="font-semibold">PM</span> stands for Permission.
                    </li>
                    <li className="ml-4">
                      <span className="font-semibold">L</span> stands for Late.
                    </li>
                  </ul>
                </aside>
            </section>
        </main>
    );
}
