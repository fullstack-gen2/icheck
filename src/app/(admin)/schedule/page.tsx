import { auth } from "@/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCodeIcon, ClockIcon } from "lucide-react";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
type Day = (typeof DAYS)[number];

const DAY_LABEL: Record<Day, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
};

interface ScheduleItem {
  id: number;
  className: string;
  subjectName: string;
  teacherName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slot: number;
  status: boolean;
}

interface SessionItem {
  id: number;
  classroomName: string;
  subjectName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

async function fetchSchedules(role: string, userId: string): Promise<ScheduleItem[]> {
  try {
    const url =
      role === "TEACHER"
        ? `${BACKEND_URL}/api/schedules/teachers/${userId}?size=100`
        : `${BACKEND_URL}/api/schedules?size=100`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.payload?.content ?? [];
  } catch {
    return [];
  }
}

async function fetchTodaySessions(role: string, userId: string): Promise<SessionItem[]> {
  if (role !== "TEACHER") return [];
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/sessions/teachers/${userId}/upcoming?size=20`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const today = new Date().toISOString().slice(0, 10);
    const all: SessionItem[] = json?.payload?.content ?? [];
    return all.filter((s) => s.sessionDate === today);
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
  const role = session?.user?.role ?? "ADMIN";
  const userId = session?.user?.userId ?? "1";

  const [schedules, todaySessions] = await Promise.all([
    fetchSchedules(role, userId),
    fetchTodaySessions(role, userId),
  ]);

  // Group schedules by day
  const byDay: Record<string, ScheduleItem[]> = {};
  for (const day of DAYS) byDay[day] = [];
  for (const s of schedules) {
    const key = s.dayOfWeek?.toUpperCase();
    if (key && byDay[key] !== undefined) byDay[key].push(s);
  }

  // Index today's sessions by subject + class for matching
  const todaySessionMap = new Map<string, SessionItem>();
  for (const ts of todaySessions) {
    todaySessionMap.set(`${ts.subjectName}:${ts.classroomName}`, ts);
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

  return (
    <div className="px-5 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-black">Schedule</h1>
        <span className="text-sm text-gray-500">{schedules.length} schedules</span>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <ClockIcon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No schedules found</p>
          <p className="text-sm mt-1">Schedules are configured by admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {DAYS.map((day) => {
            const isToday = today === day;
            const items = byDay[day];
            return (
              <div
                key={day}
                className={`rounded-2xl border p-4 flex flex-col gap-3 ${
                  isToday
                    ? "border-[#273C97] bg-[#273C97]/5"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* Day header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-bold tracking-wide ${
                      isToday ? "text-[#273C97]" : "text-gray-500"
                    }`}
                  >
                    {DAY_LABEL[day]}
                  </span>
                  {isToday && (
                    <span className="text-[10px] bg-[#273C97] text-white rounded-full px-2 py-0.5 font-medium">
                      Today
                    </span>
                  )}
                </div>

                {items.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center py-4">—</p>
                ) : (
                  items.map((item) => {
                    const todaySession = isToday
                      ? todaySessionMap.get(`${item.subjectName}:${item.className}`)
                      : undefined;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl p-3 flex flex-col gap-1.5 border ${
                          item.status
                            ? "bg-white border-gray-100"
                            : "bg-gray-50 border-gray-100 opacity-60"
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-900 leading-tight">
                          {item.subjectName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{item.className}</p>
                        <p className="text-xs text-gray-400">
                          {item.startTime?.slice(0, 5)} – {item.endTime?.slice(0, 5)}
                        </p>

                        {!item.status && (
                          <Badge className="bg-gray-100 text-gray-400 text-[10px] w-fit">
                            Inactive
                          </Badge>
                        )}

                        {todaySession && (
                          <div className="mt-1 flex items-center justify-between gap-1">
                            <Badge
                              className={`text-[10px] ${
                                statusColor[todaySession.status] ?? "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {todaySession.status}
                            </Badge>
                            {(todaySession.status === "SCHEDULED" ||
                              todaySession.status === "ACTIVE") && (
                              <Link href={`/sessions/${todaySession.id}`}>
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-[10px] bg-[#273C97] hover:bg-[#1e2e7a] gap-1"
                                >
                                  <QrCodeIcon className="size-3" />
                                  QR
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
