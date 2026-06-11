"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendanceStatus, Student } from "@/types/student";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment, useState } from "react";
import { Input } from "../ui/input";

type AttendanceCheckingListProps = {
  students?: Student[];
  studentProfileBasePath?: string;
  /** ISO date (yyyy-MM-dd) of today's session. */
  sessionDate?: string | null;
  /** HH:mm[:ss] start time of today's session. */
  startTime?: string | null;
  /** HH:mm[:ss] end time of today's session. */
  endTime?: string | null;
  /** Classroom code shown next to the date/time block. */
  classCode?: string | null;
  /** Counts shown in the header summary box. */
  totalStudents?: number;
  femaleStudents?: number;
};

/** Renders 14:30:00 / 14:30 → "2:30 PM" (12-hour with am/pm). */
function fmt12(raw?: string | null): string {
  if (!raw) return "—";
  const [hh, mm] = raw.split(":");
  const h = Number(hh);
  if (Number.isNaN(h)) return raw;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mm ?? "00"} ${period}`;
}

/** "yyyy-MM-dd" → "11-Nov-2026". Falls back to the raw value on parse failure. */
function fmtDate(raw?: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${String(d.getDate()).padStart(2, "0")}-${month}-${d.getFullYear()}`;
}

export default function AttendanceCheckingList({
  students = [],
  studentProfileBasePath,
  sessionDate,
  startTime,
  endTime,
  classCode,
  totalStudents,
  femaleStudents,
}: AttendanceCheckingListProps) {
  const params = useParams<{ id?: string | string[] }>();
  const classroomId = Array.isArray(params.id) ? params.id[0] : params.id;
  const resolvedStudentProfileBasePath =
    studentProfileBasePath ??
    (classroomId
      ? `/dashboard/classrooms/${classroomId}/student-profile`
      : undefined);
  const [attendanceByStudentId, setAttendanceByStudentId] = useState<
    Record<string, AttendanceStatus | null>
  >(() =>
    students.reduce(
      (acc, student) => {
        acc[student.id] = null;
        return acc;
      },
      {} as Record<string, AttendanceStatus | null>,
    ),
  );
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const updateAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceByStudentId((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    if (status === AttendanceStatus.PRESENT) {
      setExpandedRowId((prev) => (prev === studentId ? null : prev));
    }
  };

  const clearAttendance = (studentId: string) => {
    setAttendanceByStudentId((prev) => ({
      ...prev,
      [studentId]: null,
    }));
    setExpandedRowId((prev) => (prev === studentId ? null : prev));
  };

  const toggleExpanded = (studentId: string) => {
    setExpandedRowId((prev) => (prev === studentId ? null : studentId));
  };

  const renderStatus = (studentId: string) => {
    const rawStatus = attendanceByStudentId[studentId];
    if (rawStatus === null) {
      return <span className="text-gray-400">{AttendanceStatus.PENDING}</span>;
    }

    const status = rawStatus;
    if (status === AttendanceStatus.PRESENT) {
      return <span className="text-black dark:text-white">{AttendanceStatus.PRESENT}</span>;
    }

    const isExpanded = expandedRowId === studentId;
    return (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => toggleExpanded(studentId)}
          aria-label={isExpanded ? "Collapse details" : "Expand details"}
          className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-black transition hover:bg-gray-100"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-black dark:text-white" />
          ) : (
            <ChevronDown className="h-4 w-4 text-black dark:text-white" />
          )}
        </button>
      </div>
    );
  };

  return (
    <main>
      <div className="flex items-center justify-between gap-3 pb-4">
        <Input
          placeholder="Search name..."
            className="max-w-sm py-5"
        />

         <div className="flex justify-start text-sm items-center gap-4 text-gray-600 border px-4 py-2 rounded-lg">
              <div>
                <p>Date: <span className="text-black dark:text-white">{fmtDate(sessionDate)}</span></p>
                <p className="text-right">Student(Total/ Female): <span className="text-black dark:text-white"> {totalStudents ?? students.length}/{femaleStudents ?? 0}</span></p>
              </div>
              <div>
                <p className="text-black dark:text-white">|</p>
                <p className="text-black dark:text-white">|</p>
              </div>
              <div>
                <p>Time: <span className="text-black dark:text-white"> {fmt12(startTime)} - {fmt12(endTime)}</span></p>
                <p>Class Code: <span className="text-black dark:text-white">{classCode ?? "—"}</span> </p>
              </div>
            </div>
      </div>
      <div className="overflow-hidden rounded-md border" >
        <Table >
          <TableHeader >
            <TableRow>
              <TableHead className="text-center">No.</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead className="flex justify-between items-center w-37.5">
                <span>P</span>
                <span>PM</span>
                <span>L</span>
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {students.map((student, index) => {
              const status = attendanceByStudentId[student.id];
              const isExpanded = expandedRowId === student.id;
              const hasDetails =
                status === AttendanceStatus.PENDING || status === AttendanceStatus.LATE;

              return (
                <Fragment key={student.id}>
                  <TableRow
                    className={
                      status === null ? "text-gray-400 dark:text-gray-500" : ""
                    }
                  >
                    <TableCell className="font-medium text-center">
                      {String(index + 1).padStart(3, "0")}
                    </TableCell>

                    <TableCell>{student.id}</TableCell>

                    <TableCell>
                      <Link
                        href={
                          resolvedStudentProfileBasePath
                            ? `${resolvedStudentProfileBasePath}/${student.id}`
                            : `/students/${student.id}`
                        }
                        aria-label={`View ${student.name} profile`}
                      >
                        <Image
                          src={student.profile}
                          alt={student.name}
                          width={50}
                          height={50}
                          className="rounded-xl object-cover w-12 h-12"
                        />
                      </Link>
                    </TableCell>

                    <TableCell>{student.name}</TableCell>

                    <TableCell>{student.gender}</TableCell>

                    <TableCell className="w-37.5">
                      <div className="flex justify-between items-center ">
                        <input
                          type="radio"
                          className="size-5"
                          name={student.id}
                          checked={
                            attendanceByStudentId[student.id] ===
                            AttendanceStatus.PRESENT
                          }
                          onChange={() =>
                            updateAttendance(student.id, AttendanceStatus.PRESENT)
                          }
                          onDoubleClick={() => clearAttendance(student.id)}
                        />
                        <input
                          type="radio"
                          className="size-5"
                          name={student.id}
                          checked={
                            attendanceByStudentId[student.id] ===
                            AttendanceStatus.PENDING
                          }
                          onChange={() =>
                            updateAttendance(student.id, AttendanceStatus.PENDING)
                          }
                          onDoubleClick={() => clearAttendance(student.id)}
                        />

                        <input
                          type="radio"
                          className="size-5"
                          name={student.id}
                          checked={
                            attendanceByStudentId[student.id] === AttendanceStatus.LATE
                          }
                          onChange={() =>
                            updateAttendance(student.id, AttendanceStatus.LATE)
                          }
                          onDoubleClick={() => clearAttendance(student.id)}
                        />
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      {renderStatus(student.id)}
                    </TableCell>
                  </TableRow>
                  {isExpanded && hasDetails && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-white px-8 py-4">
                        <div className="space-y-2 text-right text-sm">
                          {status === AttendanceStatus.PENDING && (
                            <p>
                              <span className="text-red-500">Permission:</span>{" "}
                              <span className="text-[#1f1f1f]">Feeling unwell</span>
                            </p>
                          )}
                          {status === AttendanceStatus.LATE && (
                            <p>
                              <span className="text-amber-500">Late:</span>{" "}
                              <span className="text-[#1f1f1f]">Traffic Jam</span>
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
