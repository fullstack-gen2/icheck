// app/(admin)/attendance/[id]/page.tsx

import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, ClipboardCheckIcon } from "lucide-react";
import Link from "next/link";
import { BASE_API_URL } from "@/auth";

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

interface AttendanceRecord {
  id: number;
  studentName: string;
  subjectName: string;
  status: string;
  method: string;
  checkInTime: string;
  remark: string | null;
  isSuspicious: boolean;
  isValidLocation: boolean;
}

async function fetchSession(id: string): Promise<Session | null> {
  try {
    const res = await fetch(`${BASE_API_URL}/attendance/sessions/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.payload ?? null;
  } catch {
    return null;
  }
}

async function fetchAttendances(sessionId: string): Promise<AttendanceRecord[]> {
  try {
    const res = await fetch(
      `${BASE_API_URL}/attendance/attendances/sessions/${sessionId}?size=100`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json?.payload?.content ?? [];
  } catch {
    return [];
  }
}

const attendanceStatusColor: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  LATE: "bg-yellow-100 text-yellow-700",
  ABSENT: "bg-red-100 text-red-600",
  EXCUSED: "bg-blue-100 text-blue-600",
};

const sessionStatusColor: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
};

export default async function AttendanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, records] = await Promise.all([
    fetchSession(id),
    fetchAttendances(id),
  ]);

  return (
    <div className="px-5 py-8">
      {/* Back */}
      <Link
        href="/attendance"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeftIcon className="size-4" />
        Back to Attendance
      </Link>

      {/* Session info */}
      {session ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{session.subjectName}</h1>
              <p className="text-gray-500 mt-1">{session.classroomName} &nbsp;·&nbsp; {session.teacherName}</p>
              <p className="text-sm text-gray-400 mt-0.5">
                {session.sessionDate} &nbsp;·&nbsp; {session.startTime?.slice(0, 5)} – {session.endTime?.slice(0, 5)}
              </p>
            </div>
            <Badge className={`${sessionStatusColor[session.status] ?? "bg-gray-100 text-gray-500"} shrink-0`}>
              {session.status}
            </Badge>
          </div>
        </div>
      ) : (
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Session #{id}</h1>
      )}

      {/* Attendance records */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Attendance Records</h2>
        <span className="text-sm text-gray-400">{records.length} students</span>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <ClipboardCheckIcon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No attendance records yet</p>
          <p className="text-sm mt-1">Students check in via QR code during the session.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Method</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Check-in Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Flags</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, index) => (
                <tr
                  key={r.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index === records.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{r.studentName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`text-xs ${attendanceStatusColor[r.status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">
                    {r.method?.replace("_", " ") ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {r.checkInTime
                      ? new Date(r.checkInTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-1.5">
                      {r.isSuspicious && (
                        <Badge className="bg-red-50 text-red-500 text-[10px]">Suspicious</Badge>
                      )}
                      {r.isValidLocation === false && (
                        <Badge className="bg-orange-50 text-orange-500 text-[10px]">Off-site</Badge>
                      )}
                      {!r.isSuspicious && r.isValidLocation !== false && (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </div>
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
