import { getServerUser } from "@/auth-server";
import { backendFetch } from "@/lib/api-fetch";
import Link from "next/link";
import { ClassCard } from "@/components/ui/class-card";
import { ClassroomAddButton } from "@/components/classroom-add-button";
import { UsersIcon, GraduationCapIcon, BookOpenIcon, ClipboardCheckIcon } from "lucide-react";
import { fetchAllClassrooms, fetchTeacherClassrooms, fetchClassCounts } from "@/lib/classroom-helpers";

interface Summary {
  totalStudents: number;
  totalLecturers: number;
  totalClasses: number;
  totalAttendance: number;
}

const shiftLabel: Record<string, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
};

async function fetchSummary(): Promise<Summary | null> {
  try {
    const res = await backendFetch(`/dashboard/summary`);
    if (!res.ok) return null;
    return (await res.json())?.payload ?? null;
  } catch { return null; }
}

export default async function DashboardPage() {
  const user = await getServerUser();
  const role      = user?.role ?? "ADMIN";
  const userId    = user?.id ?? "";
  const isTeacher = role === "TEACHER";

  // Dashboard always shows every class the user owns (teacher → assigned +
  // substitute, admin → school-wide). The "ready to start now" view lives on
  // the sidebar's "Classes" page (/dashboard/classrooms) — see the comment
  // there for the split.
  const [summary, classrooms, classCounts] = await Promise.all([
    isTeacher ? Promise.resolve(null) : fetchSummary(),
    isTeacher ? fetchTeacherClassrooms(userId) : fetchAllClassrooms(100),
    fetchClassCounts(),
  ]);

  const stats = [
    { label: "Total Students",   value: summary?.totalStudents  ?? 0, icon: UsersIcon,           color: "bg-blue-50 text-blue-600"   },
    { label: "Total Teachers",   value: summary?.totalLecturers ?? 0, icon: GraduationCapIcon,    color: "bg-purple-50 text-purple-600" },
    { label: "Total Classes",    value: summary?.totalClasses   ?? 0, icon: BookOpenIcon,         color: "bg-green-50 text-green-600"  },
    { label: "Total Attendance", value: summary?.totalAttendance?? 0, icon: ClipboardCheckIcon,   color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="px-7 py-7">
      <h1 className="text-3xl font-bold text-foreground mb-8">Dashboard</h1>

      {!isTeacher && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
              <div className={`rounded-xl p-3 ${s.color}`}>
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
                <p className="mt-0.5 text-base text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-foreground">
          {isTeacher ? "All My Classes" : "Class Info"}
        </h2>
        <div className="flex items-center gap-3">
          {!isTeacher && <ClassroomAddButton />}
          <span className="text-sm pr-2 text-muted-foreground/70">{classrooms.length} classes</span>
        </div>
      </div>

      {classrooms.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/70 bg-card rounded-2xl border border-border">
          <BookOpenIcon className="size-10 mx-auto mb-3 opacity-40" />
          <p>{isTeacher ? "You have no classes assigned." : "No classes found."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
          {classrooms.map((c) => {
            const counts = classCounts[c.className];
            return (
            <Link
              key={c.id}
              href={`/dashboard/classrooms/${c.id}`}
              className="block hover:scale-[1.01] transition-transform">
              <ClassCard
                title={c.programTypeName ?? "Class"}
                status={c.status ? "Active" : "Inactive"}
                classNameValue={c.className}
                shift={shiftLabel[c.shift] ?? c.shift ?? "—"}
                time={`${c.startDate ?? "?"} - ${c.endDate ?? "?"}`}
                lab={c.lab ?? undefined}
                students={counts ? `${counts.total}/${counts.female}` : "0/0"}
                code={c.classCode ?? String(c.id)}
                year={c.year}
                semester={c.semester}
                generation={c.generation}
                course={/scholarship/i.test(c.programTypeName ?? "")
                  ? (c.className.match(/Fullstack|Foundation|Pre-?Uni|ITP|ITE/i)?.[0] ?? null)
                  : null}
              />
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
