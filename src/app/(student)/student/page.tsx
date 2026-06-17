"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useUser, useUpdateUser } from "@/components/user-provider";
import { QrScanner } from "@/components/qr-scanner";
import {
  useGetCurrentUserQuery,
  useGetStudentAttendanceQuery,
  useGetUserEnrollmentsQuery,
} from "@/store/api/userApi";
import { StudentTodayClasses } from "@/components/student-today-classes";
import { useGetStudentReportsQuery } from "@/store/api/reportApi";
import {
  BadgeCheckIcon,
  CameraIcon,
  ClipboardListIcon,
  Clock3Icon,
  GraduationCapIcon,
  LoaderCircleIcon,
  QrCodeIcon,
  UserRoundIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type StudentProfile = Record<string, unknown>;

function asText(value: unknown) {
  return value == null || value === "" ? "—" : String(value);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function pickArray(profile: StudentProfile | null, keys: string[]) {
  for (const key of keys) {
    const value = profile?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function programLabel(value: unknown) {
  if (!value || typeof value !== "object") return asText(value);
  const item = value as Record<string, unknown>;
  return asText(
    item.className ??
    item.name ??
    item.programName ??
    item.programTypeName ??
    item.classCode
  );
}

export default function StudentHomePage() {
  const user = useUser();
  const { data: profile = null } = useGetCurrentUserQuery();
  const [showScanner, setShowScanner] = useState(false);
  const updateUser = useUpdateUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  // Upload a new profile photo. Reuses the same multipart endpoint the sidebar
  // avatar uses (`PUT /api/auth/profile-image` → Cloudflare R2 → backend).
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await fetch("/api/auth/profile-image", { method: "PUT", body: formData });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message ?? json?.error ?? `Upload failed (${res.status}).`);
      const next = json?.payload?.profileImage ?? json?.profileImage ?? null;
      if (next) updateUser?.({ profileImage: String(next) });
      toast.success("Profile photo updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload photo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // `/me` returns just the User row. Programs (enrollments) and attendance
  // history live on dedicated endpoints — without these the profile page
  // showed "—" everywhere even for real students.
  const studentId = profile?.id ?? user?.id ?? "";
  const { data: enrollments = [] } = useGetUserEnrollmentsQuery(studentId, {
    skip: !studentId,
  });
  const { data: attendanceRows = [] } = useGetStudentAttendanceQuery(studentId, {
    skip: !studentId,
  });
  // Warnings come from generated reports (Scholarship/Bachelor < 7/10, ITE
  // scholarship < 8/10 → 1 warning; 3 warnings → exam-ineligible).
  const { data: studentReports = [] } = useGetStudentReportsQuery(Number(studentId), {
    skip: !studentId,
  });
  const warningCount = studentReports.filter((r) => r.warningStatus).length;
  const examBlocked = warningCount >= 3 || studentReports.some((r) => r.examEligible === false);

  const displayName = asText(profile?.name ?? profile?.username ?? user?.name);
  const email = asText(profile?.email ?? user?.email);
  const status = asText(profile?.status ?? profile?.accountStatus ?? "ACTIVE");
  const imageUrl = asText(profile?.profileImage ?? user?.profileImage);

  // Normalise enrolments into {id, name} so each program is clickable. Falls
  // back to the loose profile shapes if /enrollments returned nothing.
  const enrolledClasses = useMemo(() => {
    if (enrollments.length > 0) {
      return enrollments
        .map((e) => ({
          id: Number(e.classroomId ?? e.id),
          name: e.className ?? e.classroomName ?? e.classCode ?? `Class ${e.classroomId ?? e.id}`,
        }))
        .filter((c) => !Number.isNaN(c.id));
    }
    return pickArray(profile, ["programs", "classrooms", "classes", "enrollments"]).map((p, i) => ({
      id: -i - 1, // synthetic; can't filter attendance, but still displayed
      name: programLabel(p),
    }));
  }, [enrollments, profile]);

  // Which class's attendance to show. null = all classes combined. Lets a
  // student enrolled in 2 programs click one to see just that program's tally.
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Summary filtered to the selected class (or all). Derived from the raw
  // attendance list, which now carries classId from the backend.
  const summary = useMemo(() => {
    const counts = { total: 0, present: 0, late: 0, absent: 0 };
    for (const row of attendanceRows) {
      if (selectedClassId != null && Number(row.classId) !== selectedClassId) continue;
      counts.total++;
      const s = (row.status ?? "").toUpperCase();
      if (s === "PRESENT") counts.present++;
      else if (s === "LATE" || s === "LATE_OUT") counts.late++;
      else if (s === "ABSENT") counts.absent++;
    }
    return counts;
  }, [attendanceRows, selectedClassId]);

  const selectedClassName = selectedClassId != null
    ? (enrolledClasses.find((c) => c.id === selectedClassId)?.name ?? "Selected class")
    : null;
  const totalAttendance = asText(summary.total);
  const present = asText(summary.present);
  const late = asText(summary.late);
  const absent = asText(summary.absent);

  return (
    <div className="space-y-6 px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Clickable avatar → upload a new profile photo. */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="group relative size-16 shrink-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Change profile photo"
          >
            <Avatar className="size-16 rounded-2xl">
              {imageUrl !== "—" ? <AvatarImage src={imageUrl} alt={displayName} className="rounded-2xl" /> : null}
              <AvatarFallback className="rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
                {initials(displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading
                ? <LoaderCircleIcon className="size-5 animate-spin text-white" />
                : <CameraIcon className="size-5 text-white" />}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                My Information
              </h1>
              <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/10">
                <BadgeCheckIcon className="size-3.5" />
                {status}
              </Badge>
            </div>
            <p className="mt-1 truncate text-base font-medium text-foreground">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCapIcon className="size-5 text-primary" />
            <h2 className="font-semibold text-foreground">Current Programs</h2>
            {enrolledClasses.length > 1 && (
              <span className="text-xs text-muted-foreground/70">· tap one for its attendance</span>
            )}
          </div>
          {enrolledClasses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {/* "All" chip + one chip per enrolled class. Selecting a class
                  filters the attendance summary on the right to that program. */}
              {enrolledClasses.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedClassId(null)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedClassId == null
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  All
                </button>
              )}
              {enrolledClasses.map((c) => {
                const active = selectedClassId === c.id;
                const clickable = c.id > 0; // synthetic ids (no enrolment) aren't filterable
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && setSelectedClassId(active ? null : c.id)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-default ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">You are not enrolled in any class yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardListIcon className="size-5 text-primary" />
            <h2 className="font-semibold text-foreground">
              Attendance Status
            </h2>
            <span className="text-xs text-muted-foreground/70">
              · {selectedClassName ?? "all classes"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoMini label="Total" value={totalAttendance} />
            <InfoMini label="Present" value={present} />
            <InfoMini label="Late" value={late} />
            <InfoMini label="Absent" value={absent} />
          </div>

          {/* Warnings — 3 = exam-ineligible. */}
          <div className={`mt-3 flex items-center justify-between rounded-xl border px-4 py-3 ${
            examBlocked
              ? "border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
              : warningCount > 0
                ? "border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
                : "border-border bg-background/50"
          }`}>
            <div className="flex items-center gap-2 text-sm">
              <ClipboardListIcon className={`size-4 ${examBlocked ? "text-red-600" : warningCount > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
              <span className="font-medium text-foreground">Warnings</span>
              <span className="text-muted-foreground/70">· 3 = exam-ineligible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold tabular-nums ${examBlocked ? "text-red-600" : warningCount > 0 ? "text-amber-600" : "text-foreground"}`}>
                {warningCount}/3
              </span>
              {examBlocked && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                  Not eligible for exam
                </span>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Today's sessions — shows concurrent classes, each with status + a
          Leave (check-out) action that drives the LATE_OUT rule. */}
      <StudentTodayClasses />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={() => setShowScanner(true)}
          className="bg-primary text-primary-foreground rounded-2xl p-6 text-left hover:bg-primary/90 active:scale-95 transition-all shadow-md"
        >
          <QrCodeIcon className="size-8 mb-3 opacity-90" />
          <h2 className="text-lg font-semibold mb-1">Check In</h2>
          <p className="text-sm text-white/70">
            Scan the QR code shown in class to record your attendance.
          </p>
        </button>

        {/* Missed the QR, need permission, or leaving early? Submit a request. */}
        <Link
          href="/student/require-permission"
          className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:border-primary/40 active:scale-95 transition-all"
        >
          <ClipboardListIcon className="size-8 mb-3 text-primary opacity-80" />
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Request Attendance Amendment
          </h2>
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t scan in time, or need to leave early? Send a request —
            an admin reviews it and you&apos;ll be notified of the decision.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3Icon className="size-4" />
            Reviewed by an admin.
          </div>
        </Link>
      </div>

      {showScanner && (
        <QrScanner onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}

function InfoMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <UserRoundIcon className="size-3.5" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
