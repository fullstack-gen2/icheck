import AttendanceCheckingList from "@/components/table/check_attendance";
import { backendFetch } from "@/lib/api-fetch";
import { AttendanceStatus, type Student } from "@/types/student";
import Link from "next/link";
import { AiOutlineQrcode } from "react-icons/ai";

interface Classroom {
  className: string;
  classCode?: string;
}

interface SessionLite {
  id: number;
  sessionDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: string | null;
}

async function fetchClassroom(id: string): Promise<Classroom | null> {
  try {
    const res = await backendFetch(`/classrooms/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.payload ?? null;
  } catch { return null; }
}

/** Today's session for this classroom (if any). Defaults to the first row the
 *  backend returns — the same window we use for live attendance. The
 *  `ensure-today` call upfront catches the edge case where admin created the
 *  schedule after the daily 06:00 session-generator already ran. */
async function fetchTodaySession(classroomId: string): Promise<SessionLite | null> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    // Idempotent — creates today's row only if missing.
    await backendFetch(`/sessions/classrooms/${classroomId}/ensure-today`, {
      method: "POST",
    });
    const res = await backendFetch(
      `/sessions/classrooms/${classroomId}?from=${today}&to=${today}&size=1`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const content = json?.payload?.content ?? json?.payload ?? [];
    return Array.isArray(content) && content.length > 0 ? content[0] : null;
  } catch { return null; }
}

async function fetchStudents(id: string): Promise<Student[]> {
  try {
    const res = await backendFetch(`/classrooms/${id}/students?size=500`);
    if (!res.ok) return [];
    const json = await res.json();
    const rows = json?.payload?.content ?? json?.payload ?? [];
    if (!Array.isArray(rows)) return [];

    return rows.map((student) => ({
      id: String(student.id ?? student.studentNo ?? ""),
      name: String(student.name ?? student.fullName ?? student.username ?? "—"),
      gender: String(student.gender ?? "—"),
      phone: String(student.phone ?? student.phoneNumber ?? "—"),
      dateOfBirth: String(student.dateOfBirth ?? student.dob ?? "—"),
      profile: String(student.profileImage ?? student.profile ?? "/file.svg"),
      status: AttendanceStatus.PENDING,
    }));
  } catch {
    return [];
  }
}

export default async function TakeAttendance({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [classroom, session, students] = await Promise.all([
      fetchClassroom(id),
      fetchTodaySession(id),
      fetchStudents(id),
    ]);
    const female = students.filter(
      (s) => (s.gender ?? "").toUpperCase().startsWith("F")
    ).length;

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
        <div className="flex justify-between">
          <Link href={`/dashboard/classrooms/${id}/take-attendance/qr-code`} className="flex items-center gap-2 rounded-md border border-gray-300 bg-white dark:bg-black px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            <AiOutlineQrcode className="size-18" />
          </Link>
        </div>
            </section>
            <section>
                <AttendanceCheckingList
                  students={students}
                  sessionDate={session?.sessionDate ?? null}
                  startTime={session?.startTime ?? null}
                  endTime={session?.endTime ?? null}
                  classCode={classroom?.classCode ?? null}
                  totalStudents={students.length}
                  femaleStudents={female}
                />
            </section>
        </main>
    )
}
