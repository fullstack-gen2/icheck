import Link from "next/link";
import { BookOpenIcon } from "lucide-react";
import { ClassCard } from "@/components/ui/class-card";
import { ClassroomAddButton } from "@/components/classroom-add-button";
import { getServerUser } from "@/auth-server";
import { MyDropdownMenuCheckboxes } from "@/components/drop-donw";
import { fetchAllClassrooms, fetchClassCounts, type ClassroomSummary } from "@/lib/classroom-helpers";
import { fetchTeacherActiveClassrooms, type TeacherClassroomView } from "@/lib/session-helpers";
import { formatTime12 } from "@/lib/school-time";

type Classroom = ClassroomSummary;

const shiftLabel: Record<string, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
};

function teacherClassPeriod(c: TeacherClassroomView) {
  return c.activeSession?.startTime
    ? `${formatTime12(c.activeSession.startTime)} - ${formatTime12(c.activeSession.endTime)}`
    : `${c.startDate ?? "?"} - ${c.endDate ?? "?"}`;
}

export default async function ClassroomsPage() {
  const user = await getServerUser();
  const role = user?.role ?? "ADMIN";
  const userId = user?.id ?? "";
  const isTeacher = role === "TEACHER";

  const [classrooms, classCounts] = await Promise.all([
    isTeacher
      ? fetchTeacherActiveClassrooms(userId)
      : fetchAllClassrooms(200),
    fetchClassCounts(),
  ]);

  const activeClassrooms = isTeacher ? classrooms : classrooms.filter((c) => c.status);

  const grouped = activeClassrooms.reduce<Record<string, Classroom[]>>((acc, c) => {
    const key = c.programTypeName ?? "Other";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  const groupNames = Object.keys(grouped).sort();

  return (
    <div className="px-7 py-7 w-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isTeacher ? "My Classes" : "Classes"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isTeacher
              ? "Classes ready to teach right now."
              : "All classrooms across programs."}
          </p>
        </div>
        <div className="flex flex-col items-end sm:items-end gap-2">
          <div className="flex items-center gap-2">
            {!isTeacher && <ClassroomAddButton />}
            <MyDropdownMenuCheckboxes />
          </div>

          <span className="text-sm pr-2 text-muted-foreground">
            ({activeClassrooms.length}) {activeClassrooms.length === 1 ? "class" : "classes"}
          </span>
        </div>
      </div>

      {activeClassrooms.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border">
          <BookOpenIcon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            {isTeacher ? "No class is ready to start right now." : "No classes found."}
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
                {grouped[group].map((c) => {
                  const counts = classCounts[c.className];
                  return (
                  <Link
                    key={c.id}
                    href={`/dashboard/classrooms/${c.id}`}
                    className="block hover:scale-[1.01] transition-transform"
                  >
                    <ClassCard
                      title={c.programTypeName ?? "Class"}
                      status={isTeacher ? "Active" : c.status ? "Active" : "Inactive"}
                      classNameValue={c.className}
                      shift={shiftLabel[c.shift] ?? c.shift ?? "—"}
                      time={isTeacher ? teacherClassPeriod(c as TeacherClassroomView) : `${c.startDate ?? "?"} - ${c.endDate ?? "?"}`}
                      lab={c.lab ?? undefined}
                      students={counts ? `${counts.total}/${counts.female}` : "0/0"}
                      code={c.classCode ?? String(c.id)}
                      year={c.year}
                      semester={c.semester}
                      generation={c.generation}
                    />
                  </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
