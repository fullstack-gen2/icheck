import Link from "next/link";
import { BookOpenIcon } from "lucide-react";
import { ClassCard } from "@/components/ui/class-card";
import { getServerUser } from "@/auth-server";
import { backendFetch } from "@/lib/api-fetch";
import { MyDropdownMenuCheckboxes } from "@/components/drop-donw";
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
import { getServerUser } from "@/auth";
import { backendFetch } from "@/lib/api-fetch";
import { ClassroomsList, type ClassroomItem } from "@/components/classrooms-list";

interface Schedule {
  className: string;
}

const shiftLabel: Record<string, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
};

async function fetchAllClassrooms(): Promise<Classroom[]> {
  try {
    const res = await backendFetch(`/classrooms?size=200`);
    if (!res.ok) return [];
    return (await res.json())?.payload?.content ?? [];
  } catch {
    return [];
  }
}

async function fetchTeacherClassrooms(teacherId: string): Promise<ClassroomItem[]> {
  try {
    const [schedRes, clsRes] = await Promise.all([
      backendFetch(`/schedules/teachers/${teacherId}?size=200`),
      backendFetch(`/classrooms?size=200`),
    ]);
    const schedules: Schedule[] =
      (await schedRes.json())?.payload?.content ?? [];
    const classrooms: Classroom[] =
      (await clsRes.json())?.payload?.content ?? [];

    const teacherClassNames = new Set(schedules.map((s) => s.className));
    return classrooms.filter((c) => teacherClassNames.has(c.className));
  } catch {
    return [];
  }
}

export default async function ClassroomsPage() {
  const user = await getServerUser();
  const role = user?.role ?? "ADMIN";
  const userId = user?.id ?? "";
  const isTeacher = role === "TEACHER";

  const classrooms = isTeacher
    ? await fetchTeacherClassrooms(userId)
    : await fetchAllClassrooms();

  const activeClassrooms = classrooms.filter((c) => c.status);

  // Group by program type so admins/students see Bachelor vs Scholarship at a glance
  const grouped = activeClassrooms.reduce<Record<string, Classroom[]>>((acc, c) => {
    const key = c.programTypeName ?? "Other";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  const groupNames = Object.keys(grouped).sort();

  return (
    <div className="px-7 py-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Classes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isTeacher
              ? "Classes you are scheduled to teach."
              : "All classrooms across programs."}
          </p>
        </div>
        <div className="flex flex-col  items-end sm:items-end gap-2">
          <MyDropdownMenuCheckboxes />

          <span className="text-sm pr-2 text-muted-foreground">
            ({activeClassrooms.length}) {activeClassrooms.length === 1 ? "class" : "classes"}
          </span>
        </div>
      </div>

      {activeClassrooms.length === 0 ? (
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
              <h2 className="mb-3 text-base font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
                <span className="ml-2 text-sm font-normal text-muted-foreground/60">
                  ({grouped[group].length})
                </span>
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
                {grouped[group].map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/classrooms/${c.id}`}
                    className="block hover:scale-[1.01] transition-transform"
                  >
                    <ClassCard
                      title={c.programTypeName ?? "Class"}
                      status={c.status ? "Active" : "Inactive"}
                      classNameValue={c.className}
                      shift={shiftLabel[c.shift] ?? c.shift ?? "—"}
                      time={"8:00 - 10:00 PM"}
                      lab="Data Analytics"
                      students={`24/4`}
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
