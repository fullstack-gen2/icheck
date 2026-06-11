import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, LayersIcon, UsersIcon } from "lucide-react";
import { MdOutlineMeetingRoom } from "react-icons/md";  
import { LuUsers } from "react-icons/lu";

interface ClassCardProps {
  title: string; // program type (Bachelor / Scholarship)
  status?: string; // Active / Inactive
  variant?: "active" | "history";
  classNameValue: string;
  /** Shift label (Morning / Afternoon / Evening). */
  shift: string;
  /** Date range string (e.g. "2024-09-01 – 2025-06-30"). */
  time: string;
  /** Optional lab/room name. When omitted, a Generation/Year/Semester summary is shown instead. */
  lab?: string;
  students: string;
  code: string;

  /* Optional program-specific fields — pass only the ones that apply. */
  /** Bachelor: e.g. 1, 2, 3, 4 */
  year?: number | null;
  /** Bachelor: e.g. 1, 2 */
  semester?: number | null;
  /** Generation / cohort number (Bachelor + Scholarship). */
  generation?: number | null;
  /** Scholarship: course family (Fullstack, Foundation, Pre-Uni, ITP, ITE). */
  course?: string | null;
}


/** Tiny row of "icon · label · value". */
function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClockIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="size-3.5 text-muted-foreground/70 shrink-0" />
      <span className="text-xs text-muted-foreground/70 mr-1 shrink-0">{label}</span>
      <span className="text-sm text-foreground/80 truncate">{value}</span>
    </div>
  );
}

export function ClassCard({
  title,
  status = "Active",
  variant = "active",
  classNameValue,
  shift,
  time,
  lab,
  students,
  code,
  year,
  semester,
  generation,
  course,
}: ClassCardProps) {
  const isActive = status === "Active";
  const isHistory = variant === "history";
  const headerClass = isHistory
    ? "bg-zinc-600 dark:bg-zinc-700"
    : isActive
      ? "bg-primary"
      : "bg-gray-400";
  const cardClass = isHistory
    ? "border-zinc-300 bg-zinc-50/70 shadow-none grayscale-[0.15] dark:border-zinc-700 dark:bg-zinc-900/40"
    : "border-border bg-card shadow-sm hover:shadow-md";

  // Generation/Year/Semester/Course summary, shown alongside (or instead of) the lab.
  const infoParts: string[] = [];
  if (generation != null) infoParts.push(`Gen ${generation}`);
  if (year != null) infoParts.push(`Year ${year}`);
  if (semester != null) infoParts.push(`Sem ${semester}`);
  if (course) infoParts.push(course);
  const infoLine = infoParts.length ? infoParts.join(" · ") : null;

  return (
    <div className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border transition-shadow duration-200 ${cardClass}`}>
      {/* Top accent strip */}
      {/* <div
        className={`h-1.5 w-full ${isActive ? "bg-primary" : "bg-gray-300"}`}
      /> */}

      {/* Header */}
      <div className={`flex items-start justify-between px-5 pt-4 pb-3 ${headerClass}`}>
        <div className="flex-1 min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white">
            {title}
          </p>
          <h3 className="truncate text-lg font-bold leading-tight text-white">
            {classNameValue}
          </h3>
        </div>
        <Badge
          className={`ml-3 shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${
            isActive
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-zinc-100 text-zinc-700 border-zinc-200"
          }`}
        >
          {status}
        </Badge>
      </div>

      <div className="mx-5 border-t border-border/50" />

      {/* Body */}
      <div className="flex flex-col gap-2.5 px-5 py-4 flex-1">
        {lab && (
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <MdOutlineMeetingRoom className="size-3.5 text-muted-foreground/70 shrink-0" />
              <p className="text-base font-medium text-foreground">Lab: </p>
            </div>
            <span className="text-sm text-muted-foreground truncate ml-2">{lab}</span>
          </div>
        )}

        {infoLine && (
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <LayersIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
              <p className="text-base font-medium text-foreground">Cohort: </p>
            </div>
            <span className="text-sm text-muted-foreground truncate ml-2">{infoLine}</span>
          </div>
        )}

         <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
              <p className="text-base font-medium text-foreground">Period: </p>
            </div>
            <span className="text-sm text-muted-foreground">{time}</span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 w-full">
            <LuUsers className="size-3.5 text-muted-foreground/70 shrink-0" />
            <p className="text-base font-medium text-foreground">Students<span className="pl-1 text-sm font-normal text-muted-foreground/70">(Total/ Female)</span>: </p>
          </div>
          <UsersIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
          <span className="text-sm text-muted-foreground">{students}</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <CalendarIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
          <Badge
            className="text-[11px] border bg-muted/50 text-muted-foreground border-border"
          >
            {shift}
          </Badge>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 bg-muted/50 border-t border-border/50">
        <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wide">
          Code
        </span>
        <span className="font-mono text-sm font-semibold text-foreground/80">
          {code}
        </span>
      </div>
    </div>
  );
}
