"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/components/user-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileChartColumnIcon,
  RefreshCwIcon,
  LockIcon,
  AlertTriangleIcon,
  ChevronDownIcon,
  LoaderCircleIcon,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────
interface Classroom {
  id: number;
  className: string;
  classCode: string;
  programTypeName: string;
  generation: number;
  year: number | null;
  semester: number | null;
  shift: string;
}

interface Report {
  id: number;
  student?: { id: number; name: string; studentNo?: string };
  aClassroom?: { id: number; className: string };
  reportType: string;        // MONTHLY | SEMESTER
  reportMonth: number | null;
  reportYear: number;
  semester: number | null;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendancePercentage: number;
  attendanceScore: number;
  warningStatus: boolean;
  examEligible: boolean;
  locked: boolean;
  generatedAt: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SHIFTS  = ["MORNING","AFTERNOON","EVENING"];
const SHIFT_LABEL: Record<string,string> = { MORNING:"Morning", AFTERNOON:"Afternoon", EVENING:"Evening" };
const SCHOLARSHIP_COURSES = ["Fullstack","Foundation","Pre-Uni","ITP","ITE"];

// ── Helpers ──────────────────────────────────────────────────────────────────
function isBachelor(name: string) { return name?.toUpperCase().includes("BACHELOR"); }
function isScholarship(name: string) { return name?.toUpperCase().includes("SCHOLARSHIP"); }
function getCourse(name: string) {
  return SCHOLARSHIP_COURSES.find((c) => name?.toLowerCase().includes(c.toLowerCase())) ?? null;
}
function pct(n: number) { return `${n.toFixed(1)}%`; }

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const user = useUser();
  const isAdmin = user?.role === "ADMIN";

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [reports,    setReports]    = useState<Report[]>([]);
  const [warnings,   setWarnings]   = useState<Report[]>([]);

  const [loadingCls,  setLoadingCls]  = useState(true);
  const [loadingReps, setLoadingReps] = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [lockingId,   setLockingId]   = useState<number | null>(null);
  const [error, setError] = useState("");

  // Classroom filters
  const [progType, setProgType]             = useState<"ALL"|"BACHELOR"|"SCHOLARSHIP">("ALL");
  const [filterGeneration, setFilterGen]    = useState("");
  const [filterYear, setFilterYear]         = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterShift, setFilterShift]       = useState("");
  const [filterCourse, setFilterCourse]     = useState("");

  // Selected classroom
  const [selectedCls, setSelectedCls] = useState<Classroom | null>(null);

  // Report generation params
  const [genMonth,    setGenMonth]    = useState(String(new Date().getMonth() + 1));
  const [genSemester, setGenSemester] = useState("1");
  const [genYear,     setGenYear]     = useState(String(new Date().getFullYear()));

  // Active tab: reports | warnings
  const [tab, setTab] = useState<"reports"|"warnings">("reports");

  // Load classrooms once
  useEffect(() => {
    fetch("/attendance/api/classrooms?size=200")
      .then((r) => r.json())
      .then((j) => { setClassrooms(j?.payload?.content ?? []); setLoadingCls(false); })
      .catch(() => setLoadingCls(false));
  }, []);

  // Classroom filters
  const bachCls = useMemo(() => classrooms.filter((c) => isBachelor(c.programTypeName)), [classrooms]);
  const schoCls = useMemo(() => classrooms.filter((c) => isScholarship(c.programTypeName)), [classrooms]);
  const gens    = useMemo(() => [...new Set(
    (progType === "BACHELOR" ? bachCls : progType === "SCHOLARSHIP" ? schoCls : classrooms)
      .map((c) => c.generation).filter(Boolean)
  )].sort() as number[], [progType, bachCls, schoCls, classrooms]);
  const years   = useMemo(() => [...new Set(bachCls.map((c) => c.year).filter(Boolean))].sort() as number[], [bachCls]);
  const sems    = useMemo(() => [...new Set(bachCls.map((c) => c.semester).filter(Boolean))].sort() as number[], [bachCls]);

  const filteredCls = useMemo(() => classrooms.filter((c) => {
    if (progType === "BACHELOR"   && !isBachelor(c.programTypeName))   return false;
    if (progType === "SCHOLARSHIP"&& !isScholarship(c.programTypeName)) return false;
    if (filterGeneration && String(c.generation) !== filterGeneration)  return false;
    if (filterYear       && String(c.year)        !== filterYear)        return false;
    if (filterSemester   && String(c.semester)    !== filterSemester)    return false;
    if (filterShift      && c.shift               !== filterShift)       return false;
    if (filterCourse     && !getCourse(c.className)?.toLowerCase().includes(filterCourse.toLowerCase())) return false;
    return true;
  }), [classrooms, progType, filterGeneration, filterYear, filterSemester, filterShift, filterCourse]);

  function resetFilters() {
    setFilterGen(""); setFilterYear(""); setFilterSemester("");
    setFilterShift(""); setFilterCourse(""); setSelectedCls(null);
    setReports([]); setWarnings([]);
  }

  // Load reports for selected classroom
  async function loadReports(cls: Classroom) {
    setSelectedCls(cls);
    setLoadingReps(true);
    setReports([]); setWarnings([]); setError("");
    try {
      const [repRes, warnRes] = await Promise.all([
        fetch(`/attendance/api/reports/classrooms/${cls.id}?size=100`),
        fetch(`/attendance/api/reports/classrooms/${cls.id}/warnings`),
      ]);
      const repJson  = await repRes.json();
      const warnJson = await warnRes.json();
      setReports(repJson?.payload?.content   ?? []);
      setWarnings(warnJson?.payload?.content ?? []);
    } catch {
      setError("Failed to load reports.");
    } finally {
      setLoadingReps(false);
    }
  }

  // Generate report
  async function handleGenerate() {
    if (!selectedCls) return;
    setGenerating(true); setError("");
    try {
      const isBach = isBachelor(selectedCls.programTypeName);
      const body   = isBach
        ? { type: "semester", studentId: null, classId: selectedCls.id, semester: Number(genSemester), year: Number(genYear) }
        : { type: "monthly",  studentId: null, classId: selectedCls.id, month: Number(genMonth),       year: Number(genYear) };

      const stuRes  = await fetch(`/attendance/api/classrooms/${selectedCls.id}/students`);
      const stuJson = await stuRes.json();
      const students: { id: number }[] = stuJson?.payload?.content ?? [];

      await Promise.all(students.map((stu) =>
        fetch("/attendance/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, studentId: stu.id }),
        })
      ));
      await loadReports(selectedCls);
    } catch {
      setError("Report generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  // Lock a report
  async function handleLock(reportId: number) {
    setLockingId(reportId); setError("");
    try {
      const res  = await fetch(`/attendance/api/reports/${reportId}/lock`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) { setError(json?.message ?? "Lock failed."); return; }
      if (selectedCls) await loadReports(selectedCls);
    } finally {
      setLockingId(null);
    }
  }

  const visibleReports = tab === "warnings" ? warnings : reports;

  return (
    <div className="px-5 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-black">Reports</h1>
        {selectedCls && (
          <span className="text-sm text-gray-500">
            {reports.length} reports · {warnings.length} warnings
          </span>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-8">Select a classroom to view or generate attendance reports.</p>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* ── Left: classroom picker ──────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Program type tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {(["ALL","BACHELOR","SCHOLARSHIP"] as const).map((pt) => (
              <button key={pt} onClick={() => { setProgType(pt); resetFilters(); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  progType === pt ? "bg-[#273C97] text-white border-[#273C97]" : "bg-white text-gray-600 border-gray-200"
                }`}>
                {pt === "ALL" ? "All" : pt === "BACHELOR" ? "Bachelor" : "Scholarship"}
              </button>
            ))}
          </div>

          {/* Sub-filters */}
          {progType !== "ALL" && (
            <div className="flex flex-wrap gap-1.5">
              <FilterSel label="Gen"      value={filterGeneration} onChange={setFilterGen}
                options={gens.map((g) => ({ label: `Gen ${g}`, value: String(g) }))} />
              {progType === "BACHELOR" && <>
                <FilterSel label="Year"  value={filterYear}      onChange={setFilterYear}
                  options={years.map((y) => ({ label: `Year ${y}`, value: String(y) }))} />
                <FilterSel label="Sem"   value={filterSemester}  onChange={setFilterSemester}
                  options={sems.map((s) => ({ label: `Sem ${s}`, value: String(s) }))} />
              </>}
              {progType === "SCHOLARSHIP" && (
                <FilterSel label="Course" value={filterCourse}   onChange={setFilterCourse}
                  options={SCHOLARSHIP_COURSES.map((c) => ({ label: c, value: c }))} />
              )}
              <FilterSel label="Shift" value={filterShift} onChange={setFilterShift}
                options={SHIFTS.map((s) => ({ label: SHIFT_LABEL[s], value: s }))} />
            </div>
          )}

          {/* Classroom list */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            {loadingCls ? (
              <div className="flex justify-center py-8">
                <LoaderCircleIcon className="size-5 animate-spin text-[#273C97]" />
              </div>
            ) : filteredCls.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No classes found.</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                {filteredCls.map((c) => (
                  <button key={c.id} onClick={() => loadReports(c)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedCls?.id === c.id ? "bg-[#273C97]/5 border-l-2 border-[#273C97]" : ""
                    }`}>
                    <p className={`text-sm font-semibold leading-tight ${selectedCls?.id === c.id ? "text-[#273C97]" : "text-gray-800"}`}>
                      {c.className}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{c.classCode}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] text-gray-400">{c.programTypeName}</span>
                      {c.shift && <span className="text-[10px] text-gray-300">· {SHIFT_LABEL[c.shift] ?? c.shift}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: reports panel ─────────────────────────────── */}
        <div>
          {!selectedCls ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-300 bg-white rounded-2xl border border-dashed border-gray-200">
              <FileChartColumnIcon className="size-12 mb-3 opacity-40" />
              <p className="font-medium text-gray-400">Select a classroom</p>
              <p className="text-sm">to view attendance reports</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Generate bar */}
              <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex flex-wrap items-end gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">
                    {isBachelor(selectedCls.programTypeName) ? "Generate Semester Report" : "Generate Monthly Report"}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {isBachelor(selectedCls.programTypeName) ? (
                      <SmSelect label="Semester" value={genSemester} onChange={setGenSemester}
                        options={[1,2,3,4,5,6,7,8].map((s) => ({ label: `Sem ${s}`, value: String(s) }))} />
                    ) : (
                      <SmSelect label="Month" value={genMonth} onChange={setGenMonth}
                        options={MONTHS.map((m, i) => ({ label: m, value: String(i + 1) }))} />
                    )}
                    <SmSelect label="Year" value={genYear} onChange={setGenYear}
                      options={[2024,2025,2026,2027].map((y) => ({ label: String(y), value: String(y) }))} />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-[#273C97] hover:bg-[#1e2e7a] gap-1.5"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? <LoaderCircleIcon className="size-3.5 animate-spin" /> : <RefreshCwIcon className="size-3.5" />}
                  {generating ? "Generating…" : "Generate"}
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-gray-200">
                {(["reports","warnings"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      tab === t ? "border-[#273C97] text-[#273C97]" : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}>
                    {t === "reports" ? `All Reports (${reports.length})` : (
                      <span className="flex items-center gap-1.5">
                        <AlertTriangleIcon className="size-3.5 text-orange-400" />
                        Warnings ({warnings.length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Table */}
              {loadingReps ? (
                <div className="flex justify-center py-12">
                  <LoaderCircleIcon className="size-6 animate-spin text-[#273C97]" />
                </div>
              ) : visibleReports.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
                  <FileChartColumnIcon className="size-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No {tab === "warnings" ? "warnings" : "reports"} found.</p>
                  {tab === "reports" && <p className="text-sm mt-1">Click Generate to create reports for this class.</p>}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="px-4 py-3 font-semibold text-gray-600">Student</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Period</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-gray-600">Present</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Late</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Absent</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-gray-600">Rate</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Score</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-gray-600">Exam</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Status</TableHead>
                        {isAdmin && <TableHead className="px-4 py-3 text-right font-semibold text-gray-600">Lock</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleReports.map((r, i) => (
                        <TableRow key={r.id}
                          className={`hover:bg-gray-50 transition-colors ${i === visibleReports.length - 1 ? "" : ""}`}>
                          <TableCell className="px-4 py-3">
                            <p className="font-medium text-gray-900 text-sm">{r.student?.name ?? "—"}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{r.student?.studentNo ?? ""}</p>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                            {r.reportType === "MONTHLY"
                              ? `${MONTHS[(r.reportMonth ?? 1) - 1]} ${r.reportYear}`
                              : `Sem ${r.semester} / ${r.reportYear}`}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm font-semibold text-gray-800">
                            {r.presentCount}/{r.totalSessions}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-yellow-600 hidden md:table-cell">{r.lateCount}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-red-500 hidden md:table-cell">{r.absentCount}</TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className={`h-full rounded-full ${r.attendancePercentage >= 75 ? "bg-green-500" : r.attendancePercentage >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                                  style={{ width: `${Math.min(r.attendancePercentage, 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-semibold ${r.attendancePercentage >= 75 ? "text-green-600" : r.attendancePercentage >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                                {pct(r.attendancePercentage)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm font-semibold text-gray-700 hidden lg:table-cell">
                            {r.attendanceScore.toFixed(1)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge className={r.examEligible
                              ? "bg-green-100 text-green-700 hover:bg-green-100 text-xs"
                              : "bg-red-100 text-red-600 hover:bg-red-100 text-xs"
                            }>
                              {r.examEligible ? "Eligible" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex gap-1 flex-wrap">
                              {r.warningStatus && (
                                <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 text-[10px]">
                                  Warning
                                </Badge>
                              )}
                              {r.locked && (
                                <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 text-[10px] gap-0.5">
                                  <LockIcon className="size-2.5" /> Locked
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="px-4 py-3 text-right">
                              {!r.locked ? (
                                <Button size="sm" variant="ghost"
                                  className="h-7 px-2 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 gap-1"
                                  onClick={() => handleLock(r.id)}
                                  disabled={lockingId === r.id}
                                >
                                  {lockingId === r.id
                                    ? <LoaderCircleIcon className="size-3 animate-spin" />
                                    : <LockIcon className="size-3" />
                                  }
                                  Lock
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-300">Locked</span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Small reusable components ────────────────────────────────────────────────
function FilterSel({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-2.5 pr-6 py-1 text-xs rounded-lg border focus:outline-none ${
          value ? "border-[#273C97] bg-[#273C97]/5 text-[#273C97] font-semibold" : "border-gray-200 bg-white text-gray-600"
        }`}>
        <option value="">{label}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-gray-400" />
    </div>
  );
}

function SmSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#273C97]/30">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
    </div>
  );
}
