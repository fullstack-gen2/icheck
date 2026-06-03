"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileChartColumnIcon,
  PlayIcon,
  DownloadIcon,
  LoaderCircleIcon,
  AlertTriangleIcon,
  LockIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface Classroom {
  id: number;
  className: string;
  classCode: string;
  programTypeName: string;
}
interface Student {
  id: number;
  studentNo: string;
  name: string;
  className: string;
}
interface Report {
  id: number;
  student?: { id: number; name: string; studentNo?: string };
  aClassroom?: { id: number; className: string };
  reportType: string;
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
  isLocked?: boolean;
}

export default function ReportsPage() {
  // Pickers
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students,   setStudents]   = useState<Student[]>([]);

  const [classId,   setClassId]   = useState<string>("");
  const [studentId, setStudentId] = useState<string>("ALL");
  const [reportType,  setReportType]  = useState<"MONTHLY" | "SEMESTER">("MONTHLY");
  const [reportYear,  setReportYear]  = useState<number>(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);

  // Results
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Load classrooms once
  useEffect(() => {
    fetch("/api/v1/attendance/classrooms?size=200")
      .then((r) => r.json())
      .then((j) => setClassrooms(j?.payload?.content ?? []))
      .catch(() => {});
  }, []);

  // Load students whenever class changes
  useEffect(() => {
    if (!classId) { setStudents([]); return; }
    fetch(`/api/v1/attendance/classrooms/${classId}/students?size=500`)
      .then((r) => r.json())
      .then((j) => setStudents(j?.payload?.content ?? []))
      .catch(() => setStudents([]));
    setStudentId("ALL");
  }, [classId]);

  const selectedClass   = useMemo(() => classrooms.find((c) => String(c.id) === classId), [classrooms, classId]);
  const selectedStudent = useMemo(() => students.find((s) => String(s.id) === studentId), [students, studentId]);

  async function handleGenerate() {
    if (!classId) { toast.error("Please pick a class first."); return; }
    setGenerating(true);
    setLoading(true);
    try {
      // 1) Try to trigger generation (idempotent). Some backends auto-generate
      //    on read — if this 404s we still try to load below.
      const body = {
        classroomId: Number(classId),
        reportType,
        reportYear,
        reportMonth: reportType === "MONTHLY" ? reportMonth : null,
        ...(studentId !== "ALL" ? { studentId: Number(studentId) } : {}),
      };
      try { await api.post(`/reports`, body); } catch { /* fall through */ }

      // 2) Fetch the rows to display.
      const url = studentId !== "ALL"
        ? `/reports/students/${studentId}?size=100`
        : `/reports/classrooms/${classId}?size=200`;
      const res  = await fetch(`/api/v1/attendance${url}`);
      const json = await res.json();
      const rows: Report[] = json?.payload?.content ?? [];

      // Filter to the chosen period.
      const filtered = rows.filter((r) => {
        if (r.reportYear !== reportYear) return false;
        if (reportType === "MONTHLY" && r.reportMonth !== reportMonth) return false;
        if (reportType === "SEMESTER" && r.reportType !== "SEMESTER") return false;
        return true;
      });
      setReports(filtered);
      if (filtered.length === 0) toast.info("No data for the selected period yet.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load reports.");
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }

  function periodLabel(): string {
    const m = ["", "January","February","March","April","May","June","July","August","September","October","November","December"];
    return reportType === "MONTHLY" ? `${m[reportMonth]} ${reportYear}` : `Year ${reportYear} · Semester`;
  }

  function buildTableData() {
    const head = ["Student","Student No.","Class","Total","Present","Late","Absent","Attendance %","Score","Warning"];
    const body = reports.map((r) => [
      r.student?.name ?? "—",
      r.student?.studentNo ?? "—",
      r.aClassroom?.className ?? selectedClass?.className ?? "—",
      r.totalSessions,
      r.presentCount,
      r.lateCount,
      r.absentCount,
      `${r.attendancePercentage?.toFixed?.(1) ?? r.attendancePercentage}%`,
      r.attendanceScore,
      r.warningStatus ? "Yes" : "",
    ]);
    return { head, body };
  }

  async function exportExcel() {
    if (reports.length === 0) { toast.error("Nothing to export."); return; }
    const XLSX = await import("xlsx");
    const { head, body } = buildTableData();
    const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
    ws["!cols"] = head.map((h) => ({ wch: Math.max(h.length, 12) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    const fname = `attendance-${selectedClass?.classCode ?? classId}-${periodLabel().replace(/\s+/g, "-")}.xlsx`;
    XLSX.writeFile(wb, fname);
    toast.success("Excel file downloaded.");
  }

  async function exportPdf() {
    if (reports.length === 0) { toast.error("Nothing to export."); return; }
    const [{ jsPDF }, autoTableMod] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const autoTable = (autoTableMod as { default?: unknown }).default ?? autoTableMod;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text("Attendance Report", 40, 40);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      `${selectedClass?.className ?? ""}${selectedStudent ? " · " + selectedStudent.name : ""} · ${periodLabel()}`,
      40, 58
    );
    const { head, body } = buildTableData();
    (autoTable as unknown as (d: unknown, opts: unknown) => void)(doc, {
      head: [head],
      body,
      startY: 76,
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [39, 60, 151], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 249, 252] },
    });
    const fname = `attendance-${selectedClass?.classCode ?? classId}-${periodLabel().replace(/\s+/g, "-")}.pdf`;
    doc.save(fname);
    toast.success("PDF file downloaded.");
  }

  return (
    <div className="px-5 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a class (and optionally one student), then generate to view & export.
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs">Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
              <SelectContent>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.className}{" "}
                    <span className="text-muted-foreground/60 text-xs ml-1">{c.classCode}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="space-y-1.5">
            <Label className="text-xs">Period</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as "MONTHLY" | "SEMESTER")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="SEMESTER">Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === "MONTHLY" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Month</Label>
                <Select value={String(reportMonth)} onValueChange={(v) => setReportMonth(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={String(m)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        <div className="flex items-center justify-end gap-2 mt-4 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={reports.length === 0} className="gap-1.5">
                <DownloadIcon className="size-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Format</DropdownMenuLabel>
              <DropdownMenuItem onClick={exportExcel}>Excel (.xlsx)</DropdownMenuItem>
              <DropdownMenuItem onClick={exportPdf}>PDF (.pdf)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleGenerate} disabled={!classId || generating} className="gap-1.5">
            {generating
              ? <LoaderCircleIcon className="size-4 animate-spin" />
              : <PlayIcon className="size-4" />}
            Generate
          </Button>
        </div>
      </div>

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
