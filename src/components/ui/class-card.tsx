import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  ClockIcon,
  GraduationCapIcon,
  LayersIcon,
  BookOpenIcon,
} from "lucide-react";

interface ClassCardProps {
  /** Program type (Bachelor / Scholarship / …) — drives the row layout. */
  title: string;
  /** Active / Inactive (or any string). */
  status?: string;
  /** Class display name. */
  classNameValue: string;
  /** Shift label (Morning / Afternoon / Evening). */
  shift: string;
  /** Date range string (e.g. "2024-09-01 – 2025-06-30"). */
  time: string;
  /** Class code. */
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

const shiftColor: Record<string, string> = {
  Morning:   "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40",
  Afternoon: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900/40",
  Evening:   "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/40",
};

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
  classNameValue,
  shift,
  time,
  code,
  year,
  semester,
  generation,
  course,
}: ClassCardProps) {
  const isActive   = status === "Active";
  const isBachelor = /bachelor/i.test(title);

  return (
    <div className="group relative flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 w-full">
      {/* Top accent strip */}
      <div className={`h-1.5 w-full ${isActive ? "bg-primary" : "bg-muted"}`} />

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/80 mb-1">
            {title}
          </p>
          <h3 className="text-base font-bold text-foreground leading-tight truncate">
            {classNameValue}
          </h3>
        </div>
        <Badge
          className={`ml-3 shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${
            isActive
              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/40"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {status}
        </Badge>
      </div>

      <div className="mx-5 border-t border-border/50" />

      {/* Body — different fields for Bachelor vs Scholarship */}
      <div className="flex flex-col gap-2 px-5 py-4 flex-1">
        <Row icon={ClockIcon} label="Term" value={time} />

        {isBachelor ? (
          <>
            <Row
              icon={GraduationCapIcon}
              label="Stage"
              value={`Year ${year ?? "?"} · Sem ${semester ?? "?"}`}
            />
            {generation != null && (
              <Row icon={LayersIcon} label="Gen" value={`Generation ${generation}`} />
            )}
          </>
        ) : (
          <>
            {course && <Row icon={BookOpenIcon} label="Course" value={course} />}
            {generation != null && (
              <Row icon={LayersIcon} label="Gen" value={`Generation ${generation}`} />
            )}
          </>
        )}

        <div className="flex items-center gap-2">
          <CalendarIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
          <Badge
            className={`text-[11px] border ${shiftColor[shift] ?? "bg-muted text-muted-foreground border-border"}`}
          >
            {shift}
          </Badge>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-t border-border/50">
        <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wide">
          Code
        </span>
        <span className="text-xs font-mono font-semibold text-foreground/80">
          {code}
        </span>
      </div>
    </div>
  );
}
