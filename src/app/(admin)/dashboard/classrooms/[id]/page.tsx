import { UsersIcon } from "lucide-react";

import { backendFetch } from "@/lib/api-fetch";
import AlertDialogDemo from "@/components/popup/start_session";
import { columns } from "@/components/classdetail/column";
import { DataTableList } from "@/components/classdetail/data-table";
import type { AttendanceList } from "@/types/attendance";

interface Classroom {
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
  status: boolean;
}

const mockClassroom: Classroom = {
  id: 1,
  className: "Bachelor",
  classCode: "A001",
  programTypeName: "Bachelor",
  generation: 1,
  year: 1,
  semester: 1,
  shift: "MORNING",
  academicYear: 2026,
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  status: true,
};

const mockAttendanceData: AttendanceList[] = [
  {
    order: 1,
    id: "INV001",
    profile:
      "https://i.pinimg.com/736x/25/60/e1/2560e1cbf27a9cfa78faccde40971482.jpg",
    name: "Chan Thorn",
    gender: "Male",
    phoneNumber: "(555) 214-9087",
    dateOfBirth: "2002-04-17",
    status: "pending",
  },
  {
    order: 2,
    id: "INV002",
    profile:
      "https://i.pinimg.com/1200x/90/74/a6/9074a68f86e0f006a9ec7183530e66c0.jpg",
    name: "Dara",
    gender: "Male",
    phoneNumber: "(555) 673-1204",
    dateOfBirth: "2001-11-29",
    status: "pending",
  },
  {
    order: 3,
    id: "INV003",
    profile:
      "https://i.pinimg.com/736x/5f/79/ea/5f79eae006365020a1cf50534a1b4314.jpg",
    name: "Sokha",
    gender: "Female",
    phoneNumber: "(555) 398-4412",
    dateOfBirth: "2003-07-08",
    status: "present",
  },
  {
    order: 4,
    id: "INV004",
    profile:
      "https://i.pinimg.com/1200x/75/42/fe/7542fec761bbb72957ccae0839476c4a.jpg",
    name: "Nita",
    gender: "Female",
    phoneNumber: "(555) 887-2301",
    dateOfBirth: "2002-01-14",
    status: "late",
  },
  {
    order: 5,
    id: "INV005",
    profile:
      "https://i.pinimg.com/736x/12/d9/b4/12d9b479ee8cb5200d7d285e27408d5f.jpg",
    name: "Sreypov",
    gender: "Female",
    phoneNumber: "(555) 542-7769",
    dateOfBirth: "2004-09-03",
    status: "present",
  },
];

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
      <section className="mx-auto mb-2 w-full ">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-black dark:text-white">
              {classroom.className}
            </h1>
          </div>
        </div>
        <div className="flex justify-between">
          <div>
            
            <h2 className="text-2xl leading-tight text-black dark:text-white">
              បញ្ជីរាយវត្តមានសិស្ស-Student Attendance List-Today
            </h2>
          </div>
          <AlertDialogDemo
              btnName="Start Session"
              title="Start Session Now"
              firstTime="8:00"
              secondTime="12:00"/>
        </div>
      </section>

          {/* Students */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              {/* <UsersIcon className="size-5 text-primary" />
              Students */}
            </h2>
            <span className="text-sm text-muted-foreground/70">total students ({mockAttendanceData.length})</span>
          </div>

        <DataTableList columns={columns} data={mockAttendanceData} showStudentActions />


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
