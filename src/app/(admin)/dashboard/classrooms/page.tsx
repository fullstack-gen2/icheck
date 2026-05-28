import Link from "next/link";
import { BookOpenIcon } from "lucide-react";
import { ClassCard } from "@/components/ui/class-card";
import { getServerUser, BASE_API_URL } from "@/auth";

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

interface Schedule {
  className: string;
}

const SHIFT_LABEL: Record<string, string> = {
  MORNING:   "Morning",
  AFTERNOON: "Afternoon",
  EVENING:   "Evening",
};

async function fetchAllClassrooms(): Promise<Classroom[]> {
  try {
    const res = await fetch(`/api/v1/attendance/classrooms?size=200`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json())?.payload?.content ?? [];
  } catch { return []; }
}

async function fetchTeacherClassrooms(teacherId: string): Promise<Classroom[]> {
  try {
    const [schedRes, clsRes] = await Promise.all([
      fetch(`/api/v1/attendance/schedules/teachers/${teacherId}?size=200`, { cache: "no-store" }),
      fetch(`/api/v1/attendance/classrooms?size=200`, { cache: "no-store" }),
    ]);
    const schedules:  Schedule[]  = (await schedRes.json())?.payload?.content ?? [];
    const classrooms: Classroom[] = (await clsRes.json())?.payload?.content  ?? [];

    const teacherClassNames = new Set(schedules.map((s) => s.className));
    return classrooms.filter((c) => teacherClassNames.has(c.className));
  } catch { return []; }
}

export default async function ClassroomsPage() {
  const user      = await getServerUser();
  const role      = user?.role ?? "ADMIN";
  const userId    = user?.id ?? "";
  const isTeacher = role === "TEACHER";

  const classrooms = isTeacher
    ? await fetchTeacherClassrooms(userId)
    : await fetchAllClassrooms();

  // Group by program type so admins/students see Bachelor vs Scholarship at a glance
  const grouped = classrooms.reduce<Record<string, Classroom[]>>((acc, c) => {
    const key = c.programTypeName ?? "Other";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  const groupNames = Object.keys(grouped).sort();

  return (
    <div className="px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Classes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher
              ? "Classes you are scheduled to teach."
              : "All classrooms across programs."}
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {classrooms.length} {classrooms.length === 1 ? "class" : "classes"}
        </span>
      </div>

      {classrooms.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border">
          <BookOpenIcon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            {isTeacher ? "You have no classes assigned." : "No classes found."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groupNames.map((group) => (
            <section key={group}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {group}
                <span className="ml-2 text-xs font-normal text-muted-foreground/60">
                  ({grouped[group].length})
                </span>
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
                {grouped[group].map((c) => (
                  <Link
                    key={c.id}
                    href={`/api/v1/attendance/classrooms/${c.id}`}
                    className="block hover:scale-[1.01] transition-transform"
                  >
                    <ClassCard
                      title={c.programTypeName ?? "Class"}
                      status={c.status ? "Active" : "Inactive"}
                      classNameValue={c.className}
                      shift={SHIFT_LABEL[c.shift] ?? c.shift ?? "—"}
                      time={`${c.startDate ?? "?"} – ${c.endDate ?? "?"}`}
                      students={`Year ${c.year ?? "?"} / Sem ${c.semester ?? "?"}`}
                      code={c.classCode ?? String(c.id)}
                    />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
