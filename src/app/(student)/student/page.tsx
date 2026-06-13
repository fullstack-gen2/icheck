"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useUser, useUpdateUser } from "@/components/user-provider";
import { QrScanner } from "@/components/qr-scanner";
import {
  useGetCurrentUserQuery,
  useGetStudentAttendanceQuery,
  useGetUserEnrollmentsQuery,
} from "@/store/api/userApi";
import { StudentTodayClasses } from "@/components/student-today-classes";
import {
  BadgeCheckIcon,
  BookOpenIcon,
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

  const displayName = asText(profile?.name ?? profile?.username ?? user?.name);
  const email = asText(profile?.email ?? user?.email);
  const status = asText(profile?.status ?? profile?.accountStatus ?? "ACTIVE");
  const imageUrl = asText(profile?.profileImage ?? user?.profileImage);
  const programs = enrollments.length > 0
    ? enrollments
    : pickArray(profile, ["programs", "classrooms", "classes", "enrollments"]);

  // Derive the summary client-side from the raw attendance list so the page
  // never shows "—" — the backend doesn't (yet) expose a single summary
  // endpoint, and even a slow list query is cheap for one student.
  const summary = useMemo(() => {
    const counts = { total: 0, present: 0, late: 0, absent: 0 };
    for (const row of attendanceRows) {
      counts.total++;
      const s = (row.status ?? "").toUpperCase();
      if (s === "PRESENT") counts.present++;
      else if (s === "LATE" || s === "LATE_OUT") counts.late++;
      else if (s === "ABSENT") counts.absent++;
    }
    return counts;
  }, [attendanceRows]);
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
          </div>
          {programs.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {programs.map((program, index) => (
                <Badge key={index} variant="outline" className="rounded-lg px-3 py-1.5 text-sm">
                  {programLabel(program)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active program information was returned by the API.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardListIcon className="size-5 text-primary" />
            <h2 className="font-semibold text-foreground">Attendance Status</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoMini label="Total" value={totalAttendance} />
            <InfoMini label="Present" value={present} />
            <InfoMini label="Late" value={late} />
            <InfoMini label="Absent" value={absent} />
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

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <BookOpenIcon className="size-8 mb-3 text-primary opacity-80" />
          <h2 className="text-lg font-semibold text-foreground mb-1">
            My Classes
          </h2>
          <p className="text-sm text-muted-foreground">
            Review your current program and classroom status.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3Icon className="size-4" />
            Updated from your login profile.
          </div>
        </div>
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
