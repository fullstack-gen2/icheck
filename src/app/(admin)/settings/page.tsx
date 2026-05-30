"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Settings2Icon,
  PencilIcon,
  LoaderCircleIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { API_URL } from "@/lib/api-config";

interface Setting {
  id: number;
  settingKey: string;
  settingValue: string;
  type: string;
  description: string | null;
  updatedAt: string | null;
}

/* ── Friendly label map. Anything not listed falls back to humanizeKey(). ── */
const KEY_LABELS: Record<string, string> = {
  early_checkin_minutes:             "Early Check-in Window",
  late_threshold_minutes:            "Late Threshold",
  student_attendance_cutoff_minutes: "Student Attendance Cut-off",
  teacher_edit_deadline_minutes:     "Teacher Correction Deadline",
  qr_expire_seconds:                 "QR Code Expire Time",
  gps_allowed_radius_meters:         "GPS Allowed Radius",
  max_sessions_per_day:              "Maximum Sessions Per Day",
  attendance_reminder_enabled:       "Attendance Reminder",
};

/* ── Unit hint shown next to the input (so admins know what 30 means). ── */
const KEY_UNITS: Record<string, string> = {
  early_checkin_minutes:             "minutes",
  late_threshold_minutes:            "minutes",
  student_attendance_cutoff_minutes: "minutes",
  teacher_edit_deadline_minutes:     "minutes",
  qr_expire_seconds:                 "seconds",
  gps_allowed_radius_meters:         "meters",
  max_sessions_per_day:              "sessions / day",
};

function humanizeKey(key: string): string {
  return KEY_LABELS[key] ?? key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Setting | null>(null);
  const [editValue, setEditValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/settings`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason =
          res.status === 401 ? "Your session expired. Please log in again." :
          res.status === 403 ? "You don't have permission to view settings." :
          json?.message ?? json?.error ?? `HTTP ${res.status}`;
        setError(`Failed to load settings — ${reason}`);
        return;
      }
      setSettings(json?.payload ?? []);
    } catch {
      setError("Network error loading settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openEdit(s: Setting) {
    setEditing(s);
    setEditValue(s.settingValue);
    setFormError("");
  }

  function closeEdit() {
    setEditing(null);
    setFormError("");
  }

  /** Save a non-boolean value via the edit sheet. */
  async function handleSave() {
    if (!editing) return;
    if (!editValue.trim()) {
      setFormError("Value is required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`${API_URL}/settings/${encodeURIComponent(editing.settingKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: editValue.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(json?.payload?.message ?? json?.message ?? "Operation failed.");
        return;
      }
      closeEdit();
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  /** Inline boolean toggle — flips the value immediately. */
  async function toggleBoolean(s: Setting, next: boolean) {
    // Optimistic update
    setSettings((arr) =>
      arr.map((row) => (row.id === s.id ? { ...row, settingValue: String(next) } : row))
    );
    try {
      const res = await fetch(`${API_URL}/settings/${encodeURIComponent(s.settingKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: String(next) }),
      });
      if (!res.ok) {
        // Revert on failure
        setSettings((arr) =>
          arr.map((row) => (row.id === s.id ? { ...row, settingValue: s.settingValue } : row))
        );
        const json = await res.json().catch(() => ({}));
        setError(json?.payload?.message ?? json?.message ?? "Failed to update.");
      }
    } catch {
      setSettings((arr) =>
        arr.map((row) => (row.id === s.id ? { ...row, settingValue: s.settingValue } : row))
      );
      setError("Network error.");
    }
  }

  return (
    <div className="px-5 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Global configuration used across all sessions. Admins can edit the
          values below — keys themselves are fixed by the system.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            <XIcon className="size-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <LoaderCircleIcon className="size-8 animate-spin text-primary" />
        </div>
      ) : settings.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground/70 bg-card rounded-2xl border border-border">
          <Settings2Icon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No settings configured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {settings.map((s) => {
            const isBoolean = s.type === "BOOLEAN";
            const enabled   = isBoolean && s.settingValue === "true";
            const unit      = KEY_UNITS[s.settingKey];

            return (
              <div
                key={s.id}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-base leading-tight">
                      {humanizeKey(s.settingKey)}
                    </h3>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">
                        {s.description}
                      </p>
                    )}
                  </div>

                  {isBoolean ? (
                    /* Toggle switch */
                    <button
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => toggleBoolean(s, !enabled)}
                      className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                          enabled ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  ) : (
                    /* Edit button */
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      onClick={() => openEdit(s)}
                    >
                      <PencilIcon className="size-3.5" />
                      Edit
                    </Button>
                  )}
                </div>

                {/* Current value display (non-boolean) */}
                {!isBoolean && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground tabular-nums">
                      {s.settingValue}
                    </span>
                    {unit && (
                      <span className="text-sm text-muted-foreground">{unit}</span>
                    )}
                  </div>
                )}

                {isBoolean && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        enabled ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
                      }`}
                    >
                      {enabled ? <CheckIcon className="size-4" /> : <XIcon className="size-4" />}
                      {enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                )}

                {s.updatedAt && (
                  <p className="text-[11px] text-muted-foreground/60 mt-auto">
                    Updated{" "}
                    {new Date(s.updatedAt).toLocaleDateString([], {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit sheet — only for non-boolean values */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && closeEdit()}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>
              Edit — {editing ? humanizeKey(editing.settingKey) : ""}
            </SheetTitle>
            {editing?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {editing.description}
              </p>
            )}
          </SheetHeader>

          {editing && (
            <div className="flex flex-col gap-4 px-1">
              <div className="space-y-1.5">
                <Label htmlFor="setting-value">
                  Value
                  {KEY_UNITS[editing.settingKey] && (
                    <span className="ml-1 text-xs text-muted-foreground font-normal">
                      ({KEY_UNITS[editing.settingKey]})
                    </span>
                  )}
                </Label>
                <Input
                  id="setting-value"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  inputMode={editing.type === "INT" ? "numeric" : "text"}
                  autoFocus
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeEdit}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={submitting}
                >
                  {submitting && (
                    <LoaderCircleIcon className="size-4 animate-spin mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
