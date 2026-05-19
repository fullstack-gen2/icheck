import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { UsersIcon, GraduationCapIcon, BookOpenIcon, ClipboardCheckIcon } from "lucide-react";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

interface Summary {
  totalStudents: number;
  totalLecturers: number;
  totalClasses: number;
  totalAttendance: number;
}

interface Classroom {
  id: number;
  className: string;
  classCode: string;
  programTypeName: string;
  generation: number;
  year: number;
  semester: number;
  shift: string;
  academicYear: number;
  startDate: string;
  endDate: string;
  status: boolean;
}

async function fetchSummary(): Promise<Summary | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/summary`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.payload ?? null;
  } catch {
    return null;
  }
}

async function fetchClassrooms(): Promise<Classroom[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/classrooms?size=50`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.payload?.content ?? [];
  } catch {
    return [];
  }
}

const shiftLabel: Record<string, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
};

export default async function DashboardPage() {
  const [summary, classrooms] = await Promise.all([fetchSummary(), fetchClassrooms()]);

  const stats = [
    {
      label: "Total Students",
      value: summary?.totalStudents ?? 0,
      icon: UsersIcon,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Teachers",
      value: summary?.totalLecturers ?? 0,
      icon: GraduationCapIcon,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Total Classes",
      value: summary?.totalClasses ?? 0,
      icon: BookOpenIcon,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Total Attendance",
      value: summary?.totalAttendance ?? 0,
      icon: ClipboardCheckIcon,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="px-5 py-8">
      <h1 className="text-3xl font-bold text-black mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`rounded-xl p-3 ${s.color}`}>
              <s.icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Classrooms */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-800">Classes</h2>
        <span className="text-sm text-gray-400">{classrooms.length} classes</span>
      </div>

      {classrooms.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <BookOpenIcon className="size-10 mx-auto mb-3 opacity-40" />
          <p>No classes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {classrooms.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 leading-tight">{c.className}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{c.classCode}</p>
                </div>
                <Badge
                  className={
                    c.status
                      ? "bg-green-100 text-green-700 hover:bg-green-100 shrink-0"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-100 shrink-0"
                  }
                >
                  {c.status ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>
                  <span className="text-gray-400">Program:</span>{" "}
                  {c.programTypeName ?? "—"}
                </span>
                <span>
                  <span className="text-gray-400">Shift:</span>{" "}
                  {shiftLabel[c.shift] ?? c.shift ?? "—"}
                </span>
                <span>
                  <span className="text-gray-400">Year:</span> {c.year ?? "—"}
                </span>
                <span>
                  <span className="text-gray-400">Semester:</span> {c.semester ?? "—"}
                </span>
                <span>
                  <span className="text-gray-400">Generation:</span> {c.generation ?? "—"}
                </span>
                <span>
                  <span className="text-gray-400">A.Year:</span> {c.academicYear ?? "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
