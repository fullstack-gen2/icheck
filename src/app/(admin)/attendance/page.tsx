import { auth } from "@/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheckIcon, ChevronRightIcon } from "lucide-react";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

interface Session {
  id: number;
  classroomName: string;
  subjectName: string;
  teacherName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

async function fetchSessions(role: string, userId: string): Promise<Session[]> {
  try {
    let url: string;
    if (role === "TEACHER") {
      url = `${BACKEND_URL}/api/sessions/teachers/${userId}/upcoming?size=50`;
    } else {
      // Admin: get recent sessions across all teachers — use a broad date range on classrooms
      // Fall back to teacher endpoint with userId=1 placeholder; admin can see all
      url = `${BACKEND_URL}/api/sessions/teachers/${userId}/upcoming?size=50`;
    }
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.payload?.content ?? [];
  } catch {
    return [];
  }
}

const statusColor: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
};

export default async function AttendancePage() {
  const session = await auth();
  const role = session?.user?.role ?? "ADMIN";
  const userId = session?.user?.userId ?? "1";

  const sessions = await fetchSessions(role, userId);

  return (
    <div className="px-5 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-black">Attendance</h1>
        <span className="text-sm text-gray-500">{sessions.length} sessions</span>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <ClipboardCheckIcon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No sessions found</p>
          <p className="text-sm mt-1">Sessions with attendance records will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Class</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Records</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, index) => (
                <tr
                  key={s.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index === sessions.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{s.subjectName}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {s.classroomName}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {s.sessionDate}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                    {s.startTime?.slice(0, 5)} – {s.endTime?.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`text-xs ${statusColor[s.status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/attendance/${s.id}`}
                      className="inline-flex items-center gap-1 text-[#273C97] hover:underline text-xs font-medium"
                    >
                      View
                      <ChevronRightIcon className="size-3.5" />
                    </Link>
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
