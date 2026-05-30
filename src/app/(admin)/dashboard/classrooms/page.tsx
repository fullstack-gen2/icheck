import { getServerUser } from "@/auth";
import { backendFetch } from "@/lib/api-fetch";
import { ClassroomsList, type ClassroomItem } from "@/components/classrooms-list";

interface Schedule {
  className: string;
}

async function fetchAllClassrooms(): Promise<ClassroomItem[]> {
  try {
    const res = await backendFetch(`/classrooms?size=200`);
    if (!res.ok) return [];
    return (await res.json())?.payload?.content ?? [];
  } catch { return []; }
}

async function fetchTeacherClassrooms(teacherId: string): Promise<ClassroomItem[]> {
  try {
    const [schedRes, clsRes] = await Promise.all([
      backendFetch(`/schedules/teachers/${teacherId}?size=200`),
      backendFetch(`/classrooms?size=200`),
    ]);
    const schedules:  Schedule[]      = (await schedRes.json())?.payload?.content ?? [];
    const classrooms: ClassroomItem[] = (await clsRes.json())?.payload?.content  ?? [];

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

  return (
    <div className="px-5 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
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

      <ClassroomsList
        classrooms={classrooms}
        emptyMessage={
          isTeacher ? "You have no classes assigned." : "No classes found."
        }
      />
    </div>
  );
}
