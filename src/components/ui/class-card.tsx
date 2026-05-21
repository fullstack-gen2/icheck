import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, UsersIcon } from "lucide-react";

interface ClassCardProps {
  title: string;        // program type (Bachelor / Scholarship)
  status?: string;      // Active / Inactive
  classNameValue: string;
  shift: string;
  time: string;
  students: string;
  code: string;
}

const shiftColor: Record<string, string> = {
  Morning:   "bg-amber-50 text-amber-700 border-amber-200",
  Afternoon: "bg-sky-50 text-sky-700 border-sky-200",
  Evening:   "bg-violet-50 text-violet-700 border-violet-200",
};

export function ClassCard({
  title,
  status = "Active",
  classNameValue,
  shift,
  time,
  students,
  code,
}: ClassCardProps) {
  const isActive = status === "Active";

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 w-full max-w-[340px]">
      {/* Top accent strip */}
      <div className={`h-1.5 w-full ${isActive ? "bg-[#273C97]" : "bg-gray-300"}`} />

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#273C97]/70 mb-1">
            {title}
          </p>
          <h3 className="text-base font-bold text-gray-900 leading-tight truncate">
            {classNameValue}
          </h3>
        </div>
        <Badge
          className={`ml-3 shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${
            isActive
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-400 border-gray-200"
          }`}
        >
          {status}
        </Badge>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-gray-100" />

      {/* Body */}
      <div className="flex flex-col gap-2.5 px-5 py-4 flex-1">
        <div className="flex items-center gap-2">
          <ClockIcon className="size-3.5 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-600">{time}</span>
        </div>
        <div className="flex items-center gap-2">
          <UsersIcon className="size-3.5 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-600">{students}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-3.5 text-gray-400 shrink-0" />
          <Badge
            className={`text-[11px] border ${shiftColor[shift] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
          >
            {shift}
          </Badge>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
        <span className="text-[11px] text-gray-400 uppercase tracking-wide">Code</span>
        <span className="text-xs font-mono font-semibold text-gray-700">{code}</span>
      </div>
    </div>
  );
}
