import { auth } from "@/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCodeIcon, ClockIcon } from "lucide-react";

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

async function fetchSessions(teacherId: string): Promise<Session[]> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/sessions/teachers/${teacherId}/upcoming?size=30`,
      { cache: "no-store" }
    );
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
  COMPLETED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-600",
};

export default async function SchedulePage() {
  const session = await auth();
  const teacherId = session?.user?.userId ?? "1";
  const sessions = await fetchSessions(teacherId);

  return (
    <div className="px-5 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-black">Schedule</h1>
        <span className="text-sm text-gray-500">{sessions.length} sessions</span>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClockIcon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No upcoming sessions</p>
          <p className="text-sm mt-1">Sessions are generated daily from your schedule.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 truncate">
                    {s.subjectName}
                  </span>
                  <Badge
                    className={`text-xs shrink-0 ${statusColor[s.status] ?? "bg-gray-100 text-gray-500"}`}
                  >
                    {s.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 truncate">{s.classroomName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.sessionDate} &nbsp;·&nbsp;
                  {s.startTime.slice(0, 5)} – {s.endTime.slice(0, 5)}
                </p>
              </div>

              {(s.status === "SCHEDULED" || s.status === "ACTIVE") && (
                <Link href={`/sessions/${s.id}`} className="shrink-0">
                  <Button
                    size="sm"
                    className="bg-[#273C97] hover:bg-[#1e2e7a] gap-1.5"
                  >
                    <QrCodeIcon className="size-4" />
                    {s.status === "ACTIVE" ? "Show QR" : "Open QR"}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
