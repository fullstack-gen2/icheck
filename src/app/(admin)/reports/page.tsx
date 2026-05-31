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

          <div className="space-y-1.5">
            <Label className="text-xs">Student</Label>
            <Select value={studentId} onValueChange={setStudentId} disabled={!classId}>
              <SelectTrigger><SelectValue placeholder="All students" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All students</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <div className="space-y-1.5">
                <Label className="text-xs">Year</Label>
                <Input type="number" value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))} />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs">Year</Label>
              <Input type="number" value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))} />
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

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoaderCircleIcon className="size-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground/70 bg-card rounded-2xl border border-border">
          <FileChartColumnIcon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No results yet.</p>
          <p className="text-sm mt-1">Pick filters above and click Generate.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-semibold text-foreground">{selectedClass?.className}</h2>
              <p className="text-xs text-muted-foreground">
                {selectedStudent ? selectedStudent.name + " · " : ""}
                {periodLabel()} · {reports.length} row{reports.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
                Present: {reports.reduce((a, r) => a + (r.presentCount ?? 0), 0)}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300">
                Late: {reports.reduce((a, r) => a + (r.lateCount ?? 0), 0)}
              </Badge>
              <Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                Absent: {reports.reduce((a, r) => a + (r.absentCount ?? 0), 0)}
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">No.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Late</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">Attendance %</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-center">Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.student?.name ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground hidden sm:table-cell">
                      {r.student?.studentNo ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.totalSessions}</TableCell>
                    <TableCell className="text-right tabular-nums text-green-700 dark:text-green-400">{r.presentCount}</TableCell>
                    <TableCell className="text-right tabular-nums text-yellow-700 dark:text-yellow-400">{r.lateCount}</TableCell>
                    <TableCell className="text-right tabular-nums text-red-700 dark:text-red-400">{r.absentCount}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {r.attendancePercentage?.toFixed?.(1) ?? r.attendancePercentage}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.attendanceScore}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {r.warningStatus && (
                          <span title="Attendance warning">
                            <AlertTriangleIcon className="size-4 text-orange-500" />
                          </span>
                        )}
                        {r.isLocked && (
                          <span title="Locked">
                            <LockIcon className="size-4 text-muted-foreground" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
