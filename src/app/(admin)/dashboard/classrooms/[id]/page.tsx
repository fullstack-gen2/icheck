import { backendFetch } from "@/lib/api-fetch";
import { getServerUser } from "@/auth-server";
import AlertDialogDemo from "@/components/popup/start_session";
import { AssignSubstituteDialog } from "@/components/assign-substitute-dialog";
import { columns } from "@/components/classdetail/column";
import { DataTableList } from "@/components/classdetail/data-table";
import type { AttendanceList } from "@/types/attendance";
import { formatTime12 } from "@/lib/school-time";
import { fetchTodaySessionForClassroom, type SessionSummary } from "@/lib/session-helpers";

interface Classroom {
  id: number;
  className: string;
  classCode: string;
  programTypeName: string;
}

async function fetchClassroom(id: string): Promise<Classroom | null> {
  try {
    const res = await backendFetch(`/classrooms/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.payload ?? null;
  } catch { return null; }
}

async function fetchStudents(id: string): Promise<AttendanceList[]> {
  try {
    const res = await backendFetch(`/classrooms/${id}/students?size=500`);
    if (!res.ok) return [];
    const json = await res.json();
    const rows = json?.payload?.content ?? json?.payload ?? [];
    if (!Array.isArray(rows)) return [];

    return rows.map((student, index) => ({
      order: index + 1,
      id: String(student.id ?? student.studentNo ?? ""),
      name: String(student.name ?? student.fullName ?? student.username ?? "—"),
      gender: String(student.gender ?? "—"),
      profile: String(student.profileImage ?? student.profile ?? ""),
      phoneNumber: String(student.phone ?? student.phoneNumber ?? "—"),
      dateOfBirth: String(student.dateOfBirth ?? student.dob ?? "—"),
      status: student.status ? String(student.status) : undefined,
    }));
  } catch {
    return [];
  }
}

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [classroom, students, user, session] = await Promise.all([
    fetchClassroom(id),
    fetchStudents(id),
    getServerUser(),
    fetchTodaySessionForClassroom(id),
  ]);

  const isAdmin = (user?.role ?? "").toUpperCase() === "ADMIN";
  const femaleStudents = students.filter((student) => {
    const gender = student.gender?.toLowerCase?.() ?? "";
    return gender === "female" || gender === "f";
  }).length;

  return (
    <div className="px-7 py-7">
      <section className="mx-auto mb-2 w-full flex justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-black dark:text-white">
              {classroom?.className ?? "Classroom"}
            </h1>
            <h2 className="text-2xl leading-tight text-black dark:text-white">
              បញ្ជីរាយឈ្មោះសិស្ស- Student List
            </h2>
          </div>
        </div>
        <div className="flex-col">
          <div className="flex items-center justify-end gap-2">
            <AlertDialogDemo
                btnName="Start Session"
                title="Start Session Now"
                firstTime={formatTime12(session?.startTime)}
                secondTime={formatTime12(session?.endTime)}
                id={id}/>
            {isAdmin && (
              <AssignSubstituteDialog
                sessionId={(session as SessionSummary | null)?.id ?? null}
                currentSubstituteName={session?.substituteTeacherName ?? null}
              />
            )}
          </div>
            {/* Students */}
          <div className="flex justify-end mt-2">
            <span className="text-sm text-muted-foreground/70">total students ({students.length})</span>
          </div>
        </div>
      </section>

        

        <DataTableList
          columns={columns}
          data={students}
          showStudentActions
          studentProfileBasePath={`/dashboard/classrooms/${id}/student-profile`}
          sessionDate={session?.sessionDate ?? null}
          startTime={session?.startTime ?? null}
          endTime={session?.endTime ?? null}
          classCode={classroom?.classCode ?? null}
          totalStudents={students.length}
          femaleStudents={femaleStudents}
        />


          {/* {students.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground/70 bg-card rounded-2xl border border-border">
              <UsersIcon className="size-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No students enrolled yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Student No.</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Gender</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Phone</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, index) => (
                    <tr
                      key={s.id}
                      className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${
                        index === students.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="w-10 px-4 py-3 text-sm text-muted-foreground/70">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-sm text-muted-foreground/70">{s.email}</p>
                      </td>
                      <td className="hidden px-4 py-3 font-mono text-sm text-muted-foreground sm:table-cell">
                        {s.studentNo}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {s.gender === "M" ? "Male" : s.gender === "F" ? "Female" : s.gender ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {s.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            s.status === "ACTIVE"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-muted text-muted-foreground hover:bg-muted"
                          }
                        >
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )} */}
    </div>
  );
}
