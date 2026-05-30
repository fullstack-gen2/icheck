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
    fetch("/api/v1/attendance/classrooms?size=200")
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
        fetch(`/api/v1/attendance/reports/classrooms/${cls.id}?size=100`),
        fetch(`/api/v1/attendance/reports/classrooms/${cls.id}/warnings`),
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

      const stuRes  = await fetch(`/api/v1/attendance/classrooms/${selectedCls.id}/students`);
      const stuJson = await stuRes.json();
      const students: { id: number }[] = stuJson?.payload?.content ?? [];

      await Promise.all(students.map((stu) =>
        fetch("/api/v1/attendance/reports", {
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
      const res  = await fetch(`/api/v1/attendance/reports/${reportId}/lock`, { method: "POST" });
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
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        {selectedCls && (
          <span className="text-sm text-muted-foreground">
            {reports.length} reports · {warnings.length} warnings
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground/70 mb-8">Select a classroom to view or generate attendance reports.</p>

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
                className={`px-3 py-1 rounded-full text-base font-semibold border transition-all ${
                  progType === pt ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
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
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            {loadingCls ? (
              <div className="flex justify-center py-8">
                <LoaderCircleIcon className="size-5 animate-spin text-primary" />
              </div>
            ) : filteredCls.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground/70">No classes found.</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                {filteredCls.map((c) => (
                  <button key={c.id} onClick={() => loadReports(c)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                      selectedCls?.id === c.id ? "bg-primary/5 border-l-2 border-primary" : ""
                    }`}>
                    <p className={`text-base font-semibold leading-tight ${selectedCls?.id === c.id ? "text-primary" : "text-foreground"}`}>
                      {c.className}
                    </p>
                    <p className="mt-0.5 font-mono text-sm text-muted-foreground/70">{c.classCode}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <span className="text-sm text-muted-foreground/70">{c.programTypeName}</span>
                      {c.shift && <span className="text-sm text-muted-foreground/40">· {SHIFT_LABEL[c.shift] ?? c.shift}</span>}
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
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/40 bg-card rounded-2xl border border-dashed border-border">
              <FileChartColumnIcon className="size-12 mb-3 opacity-40" />
              <p className="font-medium text-muted-foreground/70">Select a classroom</p>
              <p className="text-base">to view attendance reports</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Generate bar */}
              <div className="bg-card rounded-2xl border border-border px-5 py-4 flex flex-wrap items-end gap-3">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-muted-foreground">
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
                  className="bg-primary hover:bg-primary/90 gap-1.5"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? <LoaderCircleIcon className="size-3.5 animate-spin" /> : <RefreshCwIcon className="size-3.5" />}
                  {generating ? "Generating…" : "Generate"}
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-border">
                {(["reports","warnings"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`-mb-px border-b-2 px-4 py-2 text-base font-medium transition-colors ${
                      tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground/80"
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
                  <LoaderCircleIcon className="size-6 animate-spin text-primary" />
                </div>
              ) : visibleReports.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground/70 bg-card rounded-2xl border border-border">
                  <FileChartColumnIcon className="size-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No {tab === "warnings" ? "warnings" : "reports"} found.</p>
                  {tab === "reports" && <p className="mt-1 text-base">Click Generate to create reports for this class.</p>}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Student</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Period</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Present</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Late</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Absent</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Rate</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Score</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Exam</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Status</TableHead>
                        {isAdmin && <TableHead className="px-4 py-3 text-right font-semibold text-muted-foreground">Lock</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleReports.map((r, i) => (
                        <TableRow key={r.id}
                          className={`hover:bg-muted/50 transition-colors ${i === visibleReports.length - 1 ? "" : ""}`}>
                          <TableCell className="px-4 py-3">
                            <p className="text-base font-medium text-foreground">{r.student?.name ?? "—"}</p>
                            <p className="font-mono text-sm text-muted-foreground/70">{r.student?.studentNo ?? ""}</p>
                          </TableCell>
                          <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                            {r.reportType === "MONTHLY"
                              ? `${MONTHS[(r.reportMonth ?? 1) - 1]} ${r.reportYear}`
                              : `Sem ${r.semester} / ${r.reportYear}`}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-base font-semibold text-foreground">
                            {r.presentCount}/{r.totalSessions}
                          </TableCell>
                          <TableCell className="hidden px-4 py-3 text-base text-yellow-600 md:table-cell">{r.lateCount}</TableCell>
                          <TableCell className="hidden px-4 py-3 text-base text-red-500 md:table-cell">{r.absentCount}</TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className={`h-full rounded-full ${r.attendancePercentage >= 75 ? "bg-green-500" : r.attendancePercentage >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                                  style={{ width: `${Math.min(r.attendancePercentage, 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-semibold ${r.attendancePercentage >= 75 ? "text-green-600" : r.attendancePercentage >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                                {pct(r.attendancePercentage)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden px-4 py-3 text-base font-semibold text-foreground/80 lg:table-cell">
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
                                <Badge className="bg-muted text-muted-foreground hover:bg-muted text-[10px] gap-0.5">
                                  <LockIcon className="size-2.5" /> Locked
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="px-4 py-3 text-right">
                              {!r.locked ? (
                                <Button size="sm" variant="ghost"
                                  className="h-7 gap-1 px-2 text-sm text-muted-foreground/70 hover:bg-muted hover:text-foreground/80"
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
                                <span className="text-sm text-muted-foreground/40">Locked</span>
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
        className={`appearance-none rounded-lg border py-1 pl-2.5 pr-6 text-base focus:outline-none ${
          value ? "border-primary bg-primary/5 text-primary font-semibold" : "border-border bg-card text-muted-foreground"
        }`}>
        <option value="">{label}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/70" />
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
        className="appearance-none rounded-lg border border-border bg-card py-1.5 pl-3 pr-7 text-base text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/30">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/70" />
    </div>
  );
}
