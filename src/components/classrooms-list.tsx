"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenIcon, SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ClassCard } from "@/components/ui/class-card";

export interface ClassroomItem {
  id: number;
  className: string;
  classCode: string;
  programTypeName: string;
  generation: number;
  year: number | null;
  semester: number | null;
  shift: string;
  academicYear: number;
  startDate: string;
  endDate: string;
  status: boolean;
}

const SHIFT_LABEL: Record<string, string> = {
  MORNING:   "Morning",
  AFTERNOON: "Afternoon",
  EVENING:   "Evening",
};

interface Props {
  classrooms: ClassroomItem[];
  emptyMessage: string;
}

export function ClassroomsList({ classrooms, emptyMessage }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return classrooms;
    return classrooms.filter((c) => {
      const haystack = [
        c.className,
        c.classCode,
        c.programTypeName,
        c.shift,
        `gen ${c.generation}`,
        `generation ${c.generation}`,
        c.year != null ? `year ${c.year}` : "",
        c.semester != null ? `sem ${c.semester}` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, classrooms]);

  // Group filtered results by program type
  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, ClassroomItem[]>>((acc, c) => {
      const key = c.programTypeName ?? "Other";
      (acc[key] ??= []).push(c);
      return acc;
    }, {});
  }, [filtered]);

  const groupNames = Object.keys(grouped).sort();

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by class name, code, program, shift, generation…"
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground/70 hover:text-foreground hover:bg-muted"
            aria-label="Clear search"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border">
          <BookOpenIcon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            {query ? `No classes match "${query}"` : emptyMessage}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groupNames.map((group) => (
            <section key={group}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {group}
                <span className="ml-2 text-xs font-normal text-muted-foreground/60">
                  ({grouped[group].length})
                </span>
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                {grouped[group].map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/classrooms/${c.id}`}
                    className="block hover:scale-[1.01] transition-transform"
                  >
                    <ClassCard
                      title={c.programTypeName ?? "Class"}
                      status={c.status ? "Active" : "Inactive"}
                      classNameValue={c.className}
                      shift={SHIFT_LABEL[c.shift] ?? c.shift ?? "—"}
                      time={`${c.startDate ?? "?"} – ${c.endDate ?? "?"}`}
                      code={c.classCode ?? String(c.id)}
                      year={c.year}
                      semester={c.semester}
                      generation={c.generation}
                      course={
                        /scholarship/i.test(c.programTypeName ?? "")
                          ? c.className.match(/Fullstack|Foundation|Pre-?Uni|ITP|ITE/i)?.[0] ?? null
                          : null
                      }
                    />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
