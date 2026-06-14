import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveIcon, ArrowLeftIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { backendFetch } from "@/lib/api-fetch";

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

interface Student {
  id: number;
  studentNo: string;
  name: string;
  gender: string;
  email: string;
  phone: string | null;
  className: string;
  status: string;
}

async function fetchClassroom(id: string): Promise<Classroom | null> {
  try {
    const res = await backendFetch(`/classrooms/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.payload ?? null;
  } catch {
    return null;
  }
}

async function fetchStudents(id: string): Promise<Student[]> {
  try {
    const res = await backendFetch(`/classrooms/${id}/students?size=200`);
    if (!res.ok) return [];
    const json = await res.json();
    return json?.payload?.content ?? [];
  } catch {
    return [];
  }
}

export default async function HistoryClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [classroom, students] = await Promise.all([
    fetchClassroom(id),
    fetchStudents(id),
  ]);

  if (!classroom) notFound();

  return (
    <div className="px-7">
      <section className="mx-auto mb-6 w-full px-7">
        <Link
          href="/dashboard/history-class"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          History Classes
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-zinc-300 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900/40">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ArchiveIcon className="size-5 text-muted-foreground" />
              <Badge className="border border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-100">
                History
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {classroom.className}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {classroom.programTypeName} · Code {classroom.classCode}
            </p>
          </div>
        </div>
      </section>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <UsersIcon className="size-5 text-muted-foreground" />
          Students
        </h2>
        <span className="text-sm text-muted-foreground/70">
          {students.length} enrolled
        </span>
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground/70">
          <UsersIcon className="mx-auto mb-3 size-10 opacity-40" />
          <p className="font-medium">No students enrolled.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Student</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground sm:table-cell">Student No.</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground md:table-cell">Gender</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground md:table-cell">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.id}
                  className={`border-b border-border/50 transition-colors hover:bg-muted/50 ${
                    index === students.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="w-10 px-4 py-3 text-sm text-muted-foreground/70">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{student.name}</p>
                    <p className="text-sm text-muted-foreground/70">{student.email}</p>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-sm text-muted-foreground sm:table-cell">
                    {student.studentNo}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {student.gender === "M" ? "Male" : student.gender === "F" ? "Female" : student.gender ?? "-"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {student.phone ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        student.status === "ACTIVE"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                      }
                    >
                      {student.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
