import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, UsersIcon, CalendarIcon, BookOpenIcon } from "lucide-react";

import { BASE_API_URL } from "@/auth";

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

const SHIFT_LABEL: Record<string, string> = {
  MORNING: "Morning", AFTERNOON: "Afternoon", EVENING: "Evening",
};

async function fetchClassroom(id: string): Promise<Classroom | null> {
  try {
    // Server component — must use absolute URL. Relative paths only work
    // in the browser; Node's fetch doesn't know what "/attendance" is.
    const res = await fetch(`${BASE_API_URL}/attendance/classrooms/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.payload ?? null;
  } catch { return null; }
}

async function fetchStudents(id: string): Promise<Student[]> {
  try {
    const res = await fetch(`${BASE_API_URL}/attendance/classrooms/${id}/students?size=200`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.payload?.content ?? [];
  } catch { return []; }
}

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [classroom, students] = await Promise.all([fetchClassroom(id), fetchStudents(id)]);

  // No such classroom → fall through to the app-wide 404 page so the URL
  // bar shows a real 404 status, search engines see it, and the friendly
  // not-found.tsx renders.
  if (!classroom) notFound();

  return (
    <div className="px-5 py-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 mb-6"
      >
        <ArrowLeftIcon className="size-4" />
        Back to Dashboard
      </Link>

      {/* Classroom info card */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
            <div className="h-1.5 bg-primary" />
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-1">
                    {classroom.programTypeName}
                  </p>
                  <h1 className="text-2xl font-bold text-foreground">{classroom.className}</h1>
                  <p className="text-sm font-mono text-muted-foreground/70 mt-0.5">{classroom.classCode}</p>
                </div>
                <Badge
                  className={`shrink-0 ${
                    classroom.status
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : "bg-muted text-muted-foreground/70 hover:bg-muted"
                  }`}
                >
                  {classroom.status ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-border/50">
                <InfoItem icon={CalendarIcon} label="Shift" value={SHIFT_LABEL[classroom.shift] ?? classroom.shift ?? "—"} />
                <InfoItem icon={BookOpenIcon} label="Generation" value={classroom.generation ? `Gen ${classroom.generation}` : "—"} />
                <InfoItem icon={BookOpenIcon} label="Year / Sem" value={`Year ${classroom.year ?? "?"} · Sem ${classroom.semester ?? "?"}`} />
                <InfoItem icon={CalendarIcon} label="Academic Year" value={String(classroom.academicYear ?? "—")} />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground">
                <div><span className="text-muted-foreground/70 text-xs">Start</span><p>{classroom.startDate ?? "—"}</p></div>
                <div><span className="text-muted-foreground/70 text-xs">End</span><p>{classroom.endDate ?? "—"}</p></div>
              </div>
            </div>
          </div>

          {/* Students */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <UsersIcon className="size-5 text-primary" />
              Students
            </h2>
            <span className="text-sm text-muted-foreground/70">{students.length} enrolled</span>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground/70 bg-card rounded-2xl border border-border">
              <UsersIcon className="size-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No students enrolled yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <table className="w-full text-sm">
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
                      <td className="px-4 py-3 text-muted-foreground/70 text-xs w-10">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground/70">{s.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">
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
          )}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-4 text-muted-foreground/70 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground/70">{label}</p>
        <p className="text-sm font-medium text-foreground/80">{value}</p>
      </div>
    </div>
  );
}
