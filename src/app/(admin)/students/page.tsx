"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResetDeviceButton } from "@/components/reset-device-button";
import { useSession } from "next-auth/react";
import { UsersIcon, ChevronDownIcon } from "lucide-react";

interface Student {
  id: number;
  studentNo: string;
  name: string;
  gender: string;
  email: string;
  phone: string | null;
  className: string;
  status: string;
}

interface Classroom {
  id: number;
  className: string;
  classCode: string;
  programTypeName: string;
  generation: number;
  year: number | null;
  semester: number | null;
  shift: string;
  status: boolean;
}

const SHIFTS = ["MORNING", "AFTERNOON", "EVENING"];
const SHIFT_LABEL: Record<string, string> = { MORNING: "Morning", AFTERNOON: "Afternoon", EVENING: "Evening" };

// Course types visible under Scholarship program
const SCHOLARSHIP_COURSES = ["Fullstack", "Foundation", "Pre-Uni", "ITP", "ITE"];

export default function StudentsPage() {
  const { data: session } = useSession();

  const [students, setStudents]   = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading]     = useState(true);

  // Filters
  const [programType, setProgramType] = useState<"ALL" | "BACHELOR" | "SCHOLARSHIP">("ALL");
  const [filterYear, setFilterYear]         = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterShift, setFilterShift]       = useState("");
  const [filterGeneration, setFilterGeneration] = useState("");
  const [filterCourse, setFilterCourse]     = useState(""); // scholarship only

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [sRes, cRes] = await Promise.all([
        fetch("/attendance/api/students?size=300"),
        fetch("/attendance/api/classrooms?size=200"),
      ]);
      const sJson = await sRes.json();
      const cJson = await cRes.json();
      setStudents(sJson?.payload?.content ?? []);
      setClassrooms(cJson?.payload?.content ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Build class → metadata lookup
  const classMap = useMemo(() => {
    const m = new Map<string, Classroom>();
    for (const c of classrooms) m.set(c.className, c);
    return m;
  }, [classrooms]);

  // Unique values for each filter dropdown
  const bachelorClassrooms = useMemo(() =>
    classrooms.filter((c) => c.programTypeName?.toUpperCase().includes("BACHELOR")), [classrooms]);
  const scholarshipClassrooms = useMemo(() =>
    classrooms.filter((c) => c.programTypeName?.toUpperCase().includes("SCHOLARSHIP")), [classrooms]);

  const years        = useMemo(() => [...new Set(bachelorClassrooms.map((c) => c.year).filter(Boolean))].sort() as number[], [bachelorClassrooms]);
  const semesters    = useMemo(() => [...new Set(bachelorClassrooms.map((c) => c.semester).filter(Boolean))].sort() as number[], [bachelorClassrooms]);
  const generations  = useMemo(() => [...new Set(
    (programType === "BACHELOR" ? bachelorClassrooms : scholarshipClassrooms)
      .map((c) => c.generation).filter(Boolean)
  )].sort() as number[], [programType, bachelorClassrooms, scholarshipClassrooms]);

  // Derive scholarship course from className (matches partial SCHOLARSHIP_COURSES name)
  function getCourse(className: string) {
    return SCHOLARSHIP_COURSES.find((c) => className?.toLowerCase().includes(c.toLowerCase())) ?? null;
  }

  // Filtered students
  const filtered = useMemo(() => {
    return students.filter((s) => {
      const cls = classMap.get(s.className);

      if (programType === "BACHELOR") {
        if (!cls?.programTypeName?.toUpperCase().includes("BACHELOR")) return false;
        if (filterYear && String(cls?.year) !== filterYear) return false;
        if (filterSemester && String(cls?.semester) !== filterSemester) return false;
        if (filterShift && cls?.shift !== filterShift) return false;
        if (filterGeneration && String(cls?.generation) !== filterGeneration) return false;
      } else if (programType === "SCHOLARSHIP") {
        if (!cls?.programTypeName?.toUpperCase().includes("SCHOLARSHIP")) return false;
        if (filterCourse && !getCourse(s.className)?.toLowerCase().includes(filterCourse.toLowerCase())) return false;
        if (filterShift && cls?.shift !== filterShift) return false;
        if (filterGeneration && String(cls?.generation) !== filterGeneration) return false;
      }
      return true;
    });
  }, [students, classMap, programType, filterYear, filterSemester, filterShift, filterGeneration, filterCourse]);

  function resetFilters() {
    setFilterYear(""); setFilterSemester(""); setFilterShift("");
    setFilterGeneration(""); setFilterCourse("");
  }

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-black">Students</h1>
        <span className="text-sm text-gray-500">{filtered.length} of {students.length}</span>
      </div>

      {/* Program Type Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["ALL", "BACHELOR", "SCHOLARSHIP"] as const).map((pt) => (
          <button
            key={pt}
            onClick={() => { setProgramType(pt); resetFilters(); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              programType === pt
                ? "bg-[#273C97] text-white border-[#273C97]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#273C97]/50"
            }`}
          >
            {pt === "ALL" ? "All" : pt === "BACHELOR" ? "Bachelor" : "Scholarship"}
          </button>
        ))}
      </div>

      {/* Secondary filters */}
      {programType !== "ALL" && (
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Generation */}
          <FilterSelect
            label="Generation"
            value={filterGeneration}
            onChange={setFilterGeneration}
            options={generations.map((g) => ({ label: `Gen ${g}`, value: String(g) }))}
          />

          {programType === "BACHELOR" && (
            <>
              <FilterSelect
                label="Year"
                value={filterYear}
                onChange={setFilterYear}
                options={years.map((y) => ({ label: `Year ${y}`, value: String(y) }))}
              />
              <FilterSelect
                label="Semester"
                value={filterSemester}
                onChange={setFilterSemester}
                options={semesters.map((s) => ({ label: `Sem ${s}`, value: String(s) }))}
              />
            </>
          )}

          {programType === "SCHOLARSHIP" && (
            <FilterSelect
              label="Course"
              value={filterCourse}
              onChange={setFilterCourse}
              options={SCHOLARSHIP_COURSES.map((c) => ({ label: c, value: c }))}
            />
          )}

          <FilterSelect
            label="Shift"
            value={filterShift}
            onChange={setFilterShift}
            options={SHIFTS.map((s) => ({ label: SHIFT_LABEL[s], value: s }))}
          />

          {(filterYear || filterSemester || filterShift || filterGeneration || filterCourse) && (
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600" onClick={resetFilters}>
              Clear
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading students…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <UsersIcon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No students match your filters.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Student No.</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                {isAdmin && (
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Device</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((student, index) => (
                <tr
                  key={student.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index === filtered.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-400">{student.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {student.className ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell font-mono text-xs">
                    {student.studentNo}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        student.status === "ACTIVE"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-100"
                      }
                    >
                      {student.status}
                    </Badge>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <ResetDeviceButton studentId={student.id} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Reusable filter select ──────────────────────────────────────────────────
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-1.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#273C97]/30 ${
          value
            ? "border-[#273C97] bg-[#273C97]/5 text-[#273C97] font-medium"
            : "border-gray-200 bg-white text-gray-600"
        }`}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
    </div>
  );
}
