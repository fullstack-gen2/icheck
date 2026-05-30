import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, UsersIcon } from "lucide-react";
import { MdOutlineMeetingRoom } from "react-icons/md";  
import { LuUsers } from "react-icons/lu";

interface ClassCardProps {
  title: string; // program type (Bachelor / Scholarship)
  status?: string; // Active / Inactive
  classNameValue: string;
  shift: string;
  time: string;
  lab: string;
  students: string;
  code: string;
}


export function ClassCard({
  title,
  status = "Active",
  classNameValue,
  shift,
  time,
  lab,
  students,
  code,
}: ClassCardProps) {
  const isActive = status === "Active";

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Top accent strip */}
      {/* <div
        className={`h-1.5 w-full ${isActive ? "bg-primary" : "bg-gray-300"}`}
      /> */}

      {/* Header */}
      <div className={`flex items-start justify-between px-5 pt-4 pb-3 ${isActive ? "bg-primary" : "bg-gray-300"}`}>
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
              : "bg-muted text-muted-foreground/70 border-border"
          }`}
        >
          {status}
        </Badge>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-border/50" />

      {/* Body */}
      <div className="flex flex-col gap-2.5 px-5 py-4 flex-1">
        <div className="flex items-center gap-2">
          {/* each row */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <MdOutlineMeetingRoom className="size-3.5 text-muted-foreground/70 shrink-0" />
              <p className="text-base font-medium text-foreground">Lab: </p>
            </div>
            <span className="text-sm text-muted-foreground">{lab}</span>
          </div>
        </div>

         <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
              <p className="text-base font-medium text-foreground">Time: </p>
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
            className={`text-[11px] border "bg-muted/50 text-muted-foreground border-border"}`}
          >
            <span className="text-white">{shift}</span>
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
