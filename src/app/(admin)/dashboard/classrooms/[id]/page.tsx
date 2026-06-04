import { backendFetch } from "@/lib/api-fetch";
import AlertDialogDemo from "@/components/popup/start_session";
import { columns } from "@/components/classdetail/column";
import { DataTableList } from "@/components/classdetail/data-table";
import { Classroom, mockAttendanceData, mockClassroom } from "@/lib/data/mockData/test-with-table/mock-table";


async function fetchClassroom(id: string): Promise<Classroom | null> {
  try {
    const res = await backendFetch(`/classrooms/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.payload ?? null;
  } catch { return null; }
}

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classroom = (await fetchClassroom(id)) ?? mockClassroom;

  return (
    <div className="px-7 py-7">
      <section className="mx-auto mb-2 w-full flex justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-black dark:text-white">
              {classroom.className}
            </h1>
            <h2 className="text-2xl leading-tight text-black dark:text-white">
              បញ្ជីរាយឈ្មោះសិស្ស- Student List
            </h2>
          </div>
        </div>
        <div className="flex-col">
          <AlertDialogDemo
              btnName="Start Session"
              title="Start Session Now"
              firstTime="8:00"
              secondTime="12:00"
              id={id}/>
            {/* Students */}
          <div className="flex justify-end mt-2">
            <span className="text-sm text-muted-foreground/70">total students ({mockAttendanceData.length})</span>
          </div>
        </div>
      </section>

        

        <DataTableList
          columns={columns}
          data={mockAttendanceData}
          showStudentActions
          studentProfileBasePath={`/dashboard/classrooms/${id}/student-profile`}
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
