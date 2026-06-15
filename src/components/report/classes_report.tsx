"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileChartColumnIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  LockIcon,
  DownloadIcon,
  ChevronDownIcon,
} from "lucide-react";
import { ISTAD_LOGO_URL } from "@/components/logo";
import { SingleCombobox } from "@/components/ui/multi-combobox";

/** Load a remote image as a data URL so jsPDF can embed it. */
async function loadImageDataUrl(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const data: string = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 1, h: 1 });
      img.src = data;
    });
    return { data, ...dims };
  } catch {
    return null;
  }
}
import {
  useGetClassroomsQuery,
  useGetStudentsByClassroomQuery,
  type ClassroomDto,
} from "@/store/api/attendanceApi";
import {
  useGenerateMonthlyReportMutation,
  useGenerateSemesterReportMutation,
  useGetClassroomReportsQuery,
  useGetClassroomEligibilityQuery,
  useLockReportMutation,
  type ReportDto,
} from "@/store/api/reportApi";

type Classroom = ClassroomDto;


const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const SHIFT_LABEL: Record<string, string> = {
  MORNING: "Morning", AFTERNOON: "Afternoon", EVENING: "Evening",
};

function pct(n: number) { return `${(n ?? 0).toFixed(1)}%`; }
function isBachelor(programType: string | undefined) {
  return /bachelor/i.test(programType ?? "");
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function ClassesReport() {
  const user = useUser();
  const isAdmin = user?.role === "ADMIN";

  // Left panel — classroom picker
  const { data: classrooms = [], isLoading: loadingCls } = useGetClassroomsQuery({ size: 200 });
  const [selectedCls, setSelectedCls] = useState<Classroom | null>(null);

  // Generate-form inputs (right panel header)
  const now = new Date();
  const [genYear, setGenYear]         = useState(String(now.getFullYear()));
  const [genMonth, setGenMonth]       = useState(String(now.getMonth() + 1));
  const [genSemester, setGenSemester] = useState("1");
  const [generating, setGenerating]   = useState(false);

  // Right panel — results
  const [tab, setTab] = useState<"reports" | "warnings">("reports");
  const [lockingId, setLockingId]     = useState<number | null>(null);
  const [generateMonthlyReport] = useGenerateMonthlyReportMutation();
  const [generateSemesterReport] = useGenerateSemesterReportMutation();
  const [lockReport] = useLockReportMutation();
  const {
    data: reports = [],
    isFetching: loadingReps,
    refetch: refetchReports,
  } = useGetClassroomReportsQuery(
    { classroomId: selectedCls?.id ?? 0, size: 200 },
    { skip: !selectedCls },
  );
  // Students enrolled in the selected classroom — the backend generates ONE
  // report per student, so "Generate" fans out to every enrolled student.
  const { data: classroomStudents = [] } = useGetStudentsByClassroomQuery(
    { classroomId: selectedCls?.id ?? 0, size: 500 },
    { skip: !selectedCls },
  );
  // Live eligibility — actual attendance computed by the backend now. Shown as
  // a fallback so the report is never empty: even before a formal report is
  // generated, the admin sees real attendance figures per student.
  const { data: eligibility = [] } = useGetClassroomEligibilityQuery(
    selectedCls?.id ?? 0,
    { skip: !selectedCls },
  );

  // The combobox above is the searchable picker; the left list just shows all
  // classes for quick browsing.
  const filteredCls = classrooms;

  /* ── Derived: visible reports per tab ────────────────────────────────── */
  // Map live eligibility rows into the ReportDto shape so the table renders
  // them identically. Late/absent/score aren't part of the eligibility
  // payload, so they show as derived/zero — the rate, present count, exam
  // eligibility and warnings are all real.
  const liveRows: ReportDto[] = useMemo(
    () => eligibility.map((e) => ({
      id: -e.studentId, // negative synthetic id (live, not a persisted report)
      student: { id: e.studentId, name: e.studentName, studentNo: e.studentNo },
      reportType: "LIVE",
      reportMonth: null,
      reportYear: new Date().getFullYear(),
      semester: null,
      totalSessions: e.totalSessions,
      // attendedSessions = present + late + late_out; split late out so the
      // Present / Late / Absent columns are accurate.
      presentCount: e.attendedSessions - (e.lateSessions ?? 0),
      lateCount: e.lateSessions ?? 0,
      absentCount: e.absentSessions ?? Math.max(0, e.totalSessions - e.attendedSessions),
      attendancePercentage: e.attendancePct,
      attendanceScore: e.attendancePct,
      warningStatus: !e.eligible,
      examEligible: e.eligible,
      locked: false,
    })),
    [eligibility],
  );

  // Prefer generated reports; fall back to live eligibility so the panel is
  // never empty when attendance exists.
  const effectiveReports = reports.length > 0 ? reports : liveRows;
  const warnings = useMemo(
    () => effectiveReports.filter((r) => r.warningStatus),
    [effectiveReports],
  );
  const visibleReports = tab === "warnings" ? warnings : effectiveReports;

  /* ── Click a classroom → load its existing reports ───────────────────── */
  function loadReports(c: Classroom) {
    setSelectedCls(c);
    setTab("reports");
  }

  /* ── Generate (semester for Bachelor / month for everything else) ─────
   * The backend generates ONE report per student
   * (POST /reports/monthly | /reports/semester, body: studentId+classId+...).
   * So "Generate" here fans out across every student enrolled in the class.
   */
  async function handleGenerate() {
    if (!selectedCls) return;
    if (classroomStudents.length === 0) {
      toast.error("No students enrolled in this classroom.");
      return;
    }
    setGenerating(true);
    try {
      const bachelor = isBachelor(selectedCls.programTypeName);
      const results = await Promise.allSettled(
        classroomStudents.map((student) =>
          bachelor
            ? generateSemesterReport({
                studentId: student.id,
                classId: selectedCls.id,
                semester: Number(genSemester),
                year: Number(genYear),
              }).unwrap()
            : generateMonthlyReport({
                studentId: student.id,
                classId: selectedCls.id,
                month: Number(genMonth),
                year: Number(genYear),
              }).unwrap()
        )
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;
      if (succeeded > 0) {
        toast.success(`Generated ${succeeded} report${succeeded === 1 ? "" : "s"}.`);
      }
      if (failed > 0) {
        toast.error(`${failed} report${failed === 1 ? "" : "s"} failed to generate.`);
      }
      await refetchReports();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generate failed.");
    } finally {
      setGenerating(false);
    }
  }

  /* ── Lock a single report row (Rule 15 — admin only, requires adminId) ─ */
  async function handleLock(reportId: number) {
    const adminId = Number(user?.id);
    if (!adminId || Number.isNaN(adminId)) {
      toast.error("Could not determine admin id.");
      return;
    }
    setLockingId(reportId);
    try {
      await lockReport({ id: reportId, adminId }).unwrap();
      toast.success("Report locked.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lock failed.");
    } finally {
      setLockingId(null);
    }
  }

  function periodLabel(): string {
    if (!selectedCls) return "";
    return isBachelor(selectedCls.programTypeName)
      ? `Sem ${genSemester} / ${genYear}`
      : `${MONTHS[Number(genMonth) - 1]} ${genYear}`;
  }

  function buildTableData() {
    const head = [
      "Student", "Student No.", "Period",
      "Total", "Present", "Late", "Absent",
      "Attendance %", "Score", "Exam", "Warning",
    ];
    const body = visibleReports.map((r) => [
      r.student?.name ?? "—",
      r.student?.studentNo ?? "—",
      r.reportType === "LIVE"
        ? "Live (to date)"
        : r.reportType === "MONTHLY"
        ? `${MONTHS[(r.reportMonth ?? 1) - 1]} ${r.reportYear}`
        : `Sem ${r.semester} / ${r.reportYear}`,
      r.totalSessions,
      r.presentCount,
      r.lateCount,
      r.absentCount,
      pct(r.attendancePercentage),
      r.attendanceScore?.toFixed?.(1) ?? r.attendanceScore,
      r.examEligible ? "Eligible" : "No",
      r.warningStatus ? "Yes" : "",
    ]);
    return { head, body };
  }

  async function exportExcel() {
    if (visibleReports.length === 0) { toast.error("Nothing to export."); return; }
    const XLSX = await import("xlsx");
    const { head, body } = buildTableData();
    const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
    ws["!cols"] = head.map((h) => ({ wch: Math.max(h.length, 12) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    const fname =
      `attendance-${selectedCls?.classCode ?? "report"}-${periodLabel().replace(/\s+/g, "-") || "all"}.xlsx`;
    XLSX.writeFile(wb, fname);
    toast.success("Excel file downloaded.");
  }

  async function exportPdf() {
    if (visibleReports.length === 0) { toast.error("Nothing to export."); return; }
    const [{ jsPDF }, autoTableMod, logo] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
      loadImageDataUrl(ISTAD_LOGO_URL),
    ]);
    const autoTable =
      (autoTableMod as { default?: unknown }).default ?? autoTableMod;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const NAVY: [number, number, number] = [39, 60, 151];
    const BLUE: [number, number, number] = [13, 71, 161]; // ISTAD royal blue (title)

    // ── Letterhead (centered: logo → blue title box → subtitle → id line) ──
    // "Generated …" timestamp, top-right.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Generated ${new Date().toLocaleString()}`, pageW - 40, 42, { align: "right" });

    let y = 28;
    // Logo, centered.
    if (logo) {
      const h = 58;
      const w = (logo.w / logo.h) * h;
      try { doc.addImage(logo.data, "PNG", (pageW - w) / 2, y, w, h); } catch { /* ignore */ }
      y += h + 14;
    } else {
      y += 14;
    }

    // Institute title — blue bold text, centered, wrapped (no background).
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(
      "Institute of Science and Technology Advanced Development",
      540,
    ) as string[];
    const lineH = 20;
    doc.setTextColor(...BLUE);
    titleLines.forEach((line, i) => {
      doc.text(line, pageW / 2, y + lineH * (i + 1), { align: "center" });
    });
    y += titleLines.length * lineH + 16;

    // Subtitle.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(80);
    doc.text("Student Attendance Report", pageW / 2, y, { align: "center" });
    y += 22;

    // Class identity line (name · code · generation · program · period).
    const gen = selectedCls?.generation != null ? `Gen ${selectedCls.generation}` : "";
    const idParts = [
      selectedCls?.className,
      selectedCls?.classCode ? `(${selectedCls.classCode})` : "",
      gen,
      selectedCls?.programTypeName,
      periodLabel(),
    ].filter(Boolean);
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(idParts.join("   ·   "), pageW / 2, y, { align: "center" });
    y += 18;

    // Divider.
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(1);
    doc.line(40, y, pageW - 40, y);
    y += 14;

    // ── Bordered data table (full data from the API) ──────────────────────
    const { head, body } = buildTableData();
    (autoTable as unknown as (d: unknown, opts: unknown) => void)(doc, {
      head: [head],
      body,
      startY: y,
      theme: "grid", // ruled rows + columns
      styles: { fontSize: 9, cellPadding: 5, lineColor: [210, 214, 224], lineWidth: 0.5 },
      headStyles: { fillColor: NAVY, textColor: 255, halign: "center", fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 252] },
      didDrawPage: (d: { pageNumber: number }) => {
        const ph = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${d.pageNumber}`, pageW - 40, ph - 18, { align: "right" });
        doc.text("i-Check · Smart Attendance", 40, ph - 18);
      },
    });

    const fname =
      `attendance-${selectedCls?.classCode ?? "report"}-${periodLabel().replace(/\s+/g, "-") || "all"}.pdf`;
    doc.save(fname);
    toast.success("PDF file downloaded.");
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-400 mx-auto w-full">
      {/* ── Top row: title + clean filter bar (tabs + search) ─────────── */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a class, choose a period, then Generate to create and export report papers.
          </p>
        </div>
        {/* Single searchable combobox replaces the program tabs + text search —
            type a class name or code (program shown as a hint) and pick. */}
        <div className="w-full sm:w-96">
          <SingleCombobox
            options={classrooms.map((c) => ({
              value: String(c.id),
              label: c.className,
              hint: c.classCode,
            }))}
            value={selectedCls ? String(selectedCls.id) : null}
            onChange={(v) => {
              const c = classrooms.find((cl) => String(cl.id) === v);
              if (c) loadReports(c);
            }}
            placeholder="Search & select a class…"
            searchPlaceholder="Search by class name or code…"
            emptyText="No classes found."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* ─────── Left: classroom picker ─────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Class list */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {loadingCls ? (
              <div className="flex justify-center py-12">
                <LoaderCircleIcon className="size-5 animate-spin text-primary" />
              </div>
            ) : filteredCls.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground/70">
                No classes found.
              </p>
            ) : (
              <div className="divide-y divide-border/50 max-h-[60vh] overflow-y-auto">
                {filteredCls.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => loadReports(c)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                      selectedCls?.id === c.id
                        ? "bg-primary/5 border-l-2 border-primary"
                        : ""
                    }`}
                  >
                    <p className={`text-sm font-semibold leading-tight ${
                      selectedCls?.id === c.id ? "text-primary" : "text-foreground"
                    }`}>
                      {c.className}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground/70">
                      {c.classCode}
                    </p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground/80">
                        {c.programTypeName}
                      </span>
                      {c.shift && (
                        <span className="text-xs text-muted-foreground/50">
                          · {SHIFT_LABEL[c.shift] ?? c.shift}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {!selectedCls ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/40 bg-card rounded-2xl border border-dashed border-border">
              <FileChartColumnIcon className="size-12 mb-3 opacity-40" />
              <p className="font-medium text-muted-foreground/70">Select a classroom</p>
              <p className="text-sm">to view attendance reports</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Generate bar */}
              <div className="bg-card rounded-2xl border border-border px-5 py-4 flex flex-wrap items-end gap-3 justify-between">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-muted-foreground">
                    {isBachelor(selectedCls.programTypeName)
                      ? "Generate Semester Report"
                      : "Generate Monthly Report"}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {isBachelor(selectedCls.programTypeName) ? (
                      <SmSelect
                        value={genSemester}
                        onChange={setGenSemester}
                        options={[1,2,3,4,5,6,7,8].map((s) => ({ label: `Sem ${s}`, value: String(s) }))}
                      />
                    ) : (
                      <SmSelect
                        value={genMonth}
                        onChange={setGenMonth}
                        options={MONTHS.map((m, i) => ({ label: m, value: String(i + 1) }))}
                      />
                    )}
                    <SmSelect
                      value={genYear}
                      onChange={setGenYear}
                      options={[2024,2025,2026,2027].map((y) => ({ label: String(y), value: String(y) }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Export menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={visibleReports.length === 0}
                        className="gap-1.5"
                      >
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

                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 gap-1.5"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating
                      ? <LoaderCircleIcon className="size-3.5 animate-spin" />
                      : <RefreshCwIcon className="size-3.5" />}
                    {generating ? "Generating…" : "Generate"}
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-border">
                {(["reports", "warnings"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                      tab === t
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground/80"
                    }`}
                  >
                    {t === "reports"
                      ? `All Reports (${reports.length})`
                      : (
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
                  <p className="font-medium">
                    No {tab === "warnings" ? "warnings" : "reports"} found.
                  </p>
                  {tab === "reports" && (
                    <p className="mt-1 text-sm">
                      Click Generate to create reports for this class.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
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
                          {isAdmin && (
                            <TableHead className="px-4 py-3 text-right font-semibold text-muted-foreground">Lock</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleReports.map((r) => (
                          <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                            <TableCell className="px-4 py-3">
                              <p className="text-sm font-medium text-foreground">
                                {r.student?.name ?? "—"}
                              </p>
                              <p className="font-mono text-xs text-muted-foreground/70">
                                {r.student?.studentNo ?? ""}
                              </p>
                            </TableCell>
                            <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                              {r.reportType === "LIVE"
                                ? "Live (to date)"
                                : r.reportType === "MONTHLY"
                                ? `${MONTHS[(r.reportMonth ?? 1) - 1]} ${r.reportYear}`
                                : `Sem ${r.semester} / ${r.reportYear}`}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm font-semibold text-foreground tabular-nums">
                              {r.presentCount}/{r.totalSessions}
                            </TableCell>
                            <TableCell className="hidden px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400 md:table-cell tabular-nums">
                              {r.lateCount}
                            </TableCell>
                            <TableCell className="hidden px-4 py-3 text-sm text-red-500 dark:text-red-400 md:table-cell tabular-nums">
                              {r.absentCount}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden hidden sm:block">
                                  <div
                                    className={`h-full rounded-full ${
                                      r.attendancePercentage >= 75 ? "bg-green-500" :
                                      r.attendancePercentage >= 50 ? "bg-yellow-400" : "bg-red-400"
                                    }`}
                                    style={{ width: `${Math.min(r.attendancePercentage, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-semibold ${
                                  r.attendancePercentage >= 75 ? "text-green-600 dark:text-green-400" :
                                  r.attendancePercentage >= 50 ? "text-yellow-600 dark:text-yellow-400" :
                                  "text-red-500 dark:text-red-400"
                                }`}>
                                  {pct(r.attendancePercentage)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden px-4 py-3 text-sm font-semibold text-foreground/80 lg:table-cell tabular-nums">
                              {r.attendanceScore?.toFixed?.(1) ?? r.attendanceScore}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <Badge className={r.examEligible
                                ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 hover:bg-green-100 text-xs"
                                : "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-100 text-xs"
                              }>
                                {r.examEligible ? "Eligible" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3 hidden lg:table-cell">
                              <div className="flex gap-1 flex-wrap">
                                {r.warningStatus && (
                                  <Badge className="bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 hover:bg-orange-100 text-[10px]">
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
                                {r.reportType === "LIVE" ? (
                                  // Live rows aren't persisted reports — can't lock.
                                  <span className="text-xs text-muted-foreground/40">live</span>
                                ) : !r.locked ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 gap-1 px-2 text-xs text-muted-foreground/70 hover:bg-muted hover:text-foreground/80"
                                    onClick={() => handleLock(r.id)}
                                    disabled={lockingId === r.id}
                                  >
                                    {lockingId === r.id
                                      ? <LoaderCircleIcon className="size-3 animate-spin" />
                                      : <LockIcon className="size-3" />}
                                    Lock
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground/40">Locked</span>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SmSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-border bg-card py-1.5 pl-3 pr-7 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/70" />
    </div>
  );
}
