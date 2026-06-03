import Link from "next/link";
import { ArchiveIcon } from "lucide-react";
import { getServerUser } from "@/auth-server";
import { backendFetch } from "@/lib/api-fetch";
import { MyDropdownMenuCheckboxes } from "@/components/drop-donw";
import { ClassCard } from "@/components/ui/class-card";

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

async function fetchTeacherClassrooms(teacherId: string): Promise<Classroom[]> {
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

export default async function HistoryClassPage() {
  const user = await getServerUser();
  const role = user?.role ?? "ADMIN";
  const userId = user?.id ?? "";
  const isTeacher = role === "TEACHER";

  const classrooms = isTeacher
    ? await fetchTeacherClassrooms(userId)
    : await fetchAllClassrooms();

  const historyClassrooms = classrooms.filter((c) => !c.status);
  const grouped = historyClassrooms.reduce<Record<string, Classroom[]>>((acc, c) => {
    const key = c.programTypeName ?? "Other";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});
  const groupNames = Object.keys(grouped).sort();

  return (
    <div className="px-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">History Classes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Classes that are no longer active.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:items-end">
          <MyDropdownMenuCheckboxes />

          <span className="pr-2 text-sm text-muted-foreground">
            ({historyClassrooms.length}) {historyClassrooms.length === 1 ? "class" : "classes"}
          </span>
        </div>
      </div>

      {historyClassrooms.length === 0 ? (
        <div className="rounded-2xl border bg-card py-20 text-center text-muted-foreground">
          <ArchiveIcon className="mx-auto mb-3 size-10 opacity-40" />
          <p className="font-medium">No history classes found.</p>
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
                    href={`/dashboard/history-class/${c.id}`}
                    className="block hover:scale-[1.01] transition-transform"
                  >
                    <ClassCard
                      title={c.programTypeName ?? "Class"}
                      status="History"
                      variant="history"
                      classNameValue={c.className}
                      shift={shiftLabel[c.shift] ?? c.shift ?? "-"}
                      time="Completed"
                      lab="Archived"
                      students="24/4"
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
