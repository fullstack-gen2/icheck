"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BellIcon,
  CalendarDaysIcon,
  ClockIcon,
  LoaderCircleIcon,
  MapPinIcon,
  MinusIcon,
  NetworkIcon,
  PlusIcon,
  QrCodeIcon,
  SaveIcon,
  Settings2Icon,
  ShieldCheckIcon,
  TrashIcon,
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


const KEY_LABELS: Record<string, string> = {
  early_checkin_minutes: "Early check-in window",
  late_threshold_minutes: "Late threshold",
  student_attendance_cutoff_minutes: "Student attendance cut-off",
  teacher_edit_deadline_minutes: "Teacher correction deadline",
  qr_expire_seconds: "QR code expiry",
  gps_allowed_radius_meters: "GPS allowed radius",
  max_sessions_per_day: "Maximum sessions per day",
  attendance_reminder_enabled: "Attendance reminder",
  ip_validation_enabled: "IP validation",
  school_ip_cidrs: "School IP ranges",
};

const KEY_HELP: Record<string, string> = {
  early_checkin_minutes: "How early students can check in before a session starts.",
  late_threshold_minutes: "Minutes after session start before attendance becomes late.",
  student_attendance_cutoff_minutes: "Latest time students can still submit attendance.",
  teacher_edit_deadline_minutes: "How long teachers can correct attendance after class.",
  qr_expire_seconds: "How long a generated QR code stays valid.",
  gps_allowed_radius_meters: "Allowed distance from the school location.",
  max_sessions_per_day: "Maximum sessions allowed for one class in a day.",
  attendance_reminder_enabled: "Enable or disable attendance reminders.",
  ip_validation_enabled: "Require check-ins to come from school IP ranges.",
  school_ip_cidrs: "Comma-separated school network ranges.",
};

const defaultForm = { key: "", value: "", type: "STRING", description: "" };


function humanizeKey(key: string): string {
  return KEY_LABELS[key] ?? key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function unitForSetting(key: string) {
  if (key.includes("minutes")) return "minutes";
  if (key.includes("seconds")) return "seconds";
  if (key.includes("meters")) return "meters";
  if (key.includes("per_day")) return "per day";
  return "";
}

function stepForSetting(key: string) {
  if (key.includes("seconds")) return 30;
  return 1;
}

function isNumberSetting(setting: Setting) {
  const type = setting.type.toUpperCase();
  return (
    type === "INT" ||
    setting.settingKey.includes("minutes") ||
    setting.settingKey.includes("seconds") ||
    setting.settingKey.includes("meters") ||
    setting.settingKey.includes("per_day")
  );
}

function settingGroup(key: string) {
  if (key.includes("minutes") || key.includes("seconds") || key.includes("sessions")) {
    return "Session Timing";
  }
  if (key.includes("gps") || key.includes("ip") || key.includes("cidrs")) {
    return "Check-in Rules";
  }
  return "General Options";
}

function SettingIcon({ settingKey }: { settingKey: string }) {
  if (settingKey === "late_threshold_minutes") return <ClockIcon className="size-5" />;
  if (settingKey.includes("qr")) return <QrCodeIcon className="size-5" />;
  if (settingKey.includes("gps")) return <MapPinIcon className="size-5" />;
  if (settingKey.includes("ip") || settingKey.includes("cidrs"))
    return <NetworkIcon className="size-5" />;
  if (settingKey.includes("reminder")) return <BellIcon className="size-5" />;
  if (settingKey.includes("sessions")) return <CalendarDaysIcon className="size-5" />;
  return <ShieldCheckIcon className="size-5" />;
}

function formatUpdated(date: string | null) {
  if (!date) return "Not updated";
  return new Date(date).toLocaleDateString([], {
    year: "numeric", month: "short", day: "numeric",
  });
}


function ValueField({
  type, value, onChange,
}: {
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  if (type === "BOOLEAN") {
    return (
      <select
        value={value === "true" ? "true" : "false"}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="true">Enabled</option>
        <option value="false">Disabled</option>
      </select>
    );
  }
  return (
    <Input
      placeholder={type === "INT" ? "e.g. 10" : "e.g. some_value"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}


function SettingOptionCard({
  setting, deleting, onSave, onDelete,
}: {
  setting: Setting;
  deleting: boolean;
  onSave: (setting: Setting, value: string) => Promise<void>;
  onDelete: (key: string) => void;
}) {
  const [draftValue, setDraftValue] = useState(setting.settingValue);
  const [saving, setSaving] = useState(false);
  const isBoolean = setting.type.toUpperCase() === "BOOLEAN";
  const isNumeric = isNumberSetting(setting);
  const unit = unitForSetting(setting.settingKey);
  const changed = draftValue.trim() !== setting.settingValue;

  async function save() {
    if (!draftValue.trim() || !changed) return;
    setSaving(true);
    try {
      await onSave(setting, draftValue.trim());
    } finally {
      setSaving(false);
    }
  }

  function nudge(delta: number) {
    const current = Number.parseInt(draftValue || "0", 10);
    const next = Number.isFinite(current) ? Math.max(0, current + delta) : 0;
    setDraftValue(String(next));
  }

  return (
    <Card className="min-h-56 rounded-lg">
      <CardHeader className="gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SettingIcon settingKey={setting.settingKey} />
        </div>
        <CardTitle>{humanizeKey(setting.settingKey)}</CardTitle>
        <CardDescription>
          {setting.description || KEY_HELP[setting.settingKey] || "Custom system option."}
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-red-400 hover:bg-red-50 hover:text-red-600"
            onClick={() => onDelete(setting.settingKey)}
            disabled={deleting}
          >
            {deleting
              ? <LoaderCircleIcon className="size-4 animate-spin" />
              : <TrashIcon className="size-4" />}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="mt-auto space-y-4">
        {isBoolean ? (
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <Button
              type="button"
              variant={draftValue === "true" ? "default" : "ghost"}
              className={draftValue === "true" ? "bg-green-600 text-white hover:bg-green-700" : ""}
              onClick={() => setDraftValue("true")}
            >
              Enabled
            </Button>
            <Button
              type="button"
              variant={draftValue === "false" ? "default" : "ghost"}
              className={draftValue === "false" ? "bg-muted-foreground text-background hover:bg-muted-foreground/80" : ""}
              onClick={() => setDraftValue("false")}
            >
              Disabled
            </Button>
          </div>
        ) : isNumeric ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => nudge(-stepForSetting(setting.settingKey))}
            >
              <MinusIcon className="size-4" />
            </Button>
            <div className="relative flex-1">
              <Input
                type="number"
                min={0}
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                className="h-12 pr-20 text-center text-2xl font-semibold tabular-nums"
              />
              {unit && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => nudge(stepForSetting(setting.settingKey))}
            >
              <PlusIcon className="size-4" />
            </Button>
          </div>
        ) : (
          <Input
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            className="h-12 font-mono"
          />
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/70">
            Updated {formatUpdated(setting.updatedAt)}
          </p>
          <Button
            type="button"
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={save}
            disabled={!changed || saving || !draftValue.trim()}
          >
            {saving
              ? <LoaderCircleIcon className="size-4 animate-spin" />
              : <SaveIcon className="size-4" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  const groupedSettings = useMemo(() => {
    return settings.reduce<Record<string, Setting[]>>((groups, setting) => {
      const group = settingGroup(setting.settingKey);
      groups[group] = [...(groups[group] ?? []), setting];
      return groups;
    }, {});
  }, [settings]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      // Relative path goes through the BFF gateway (same-origin) so cookies
      // travel automatically. Hard-coding the upstream host triggers CORS.
      const res = await fetch(`${API_URL}/settings`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason =
          res.status === 401 ? "Your session expired. Please log in again." :
          res.status === 403 ? "You don't have permission to view settings." :
          json?.message ?? json?.error ?? `HTTP ${res.status}`;
        setError(`Failed to load settings - ${reason}`);
        return;
      }
      setSettings(json?.payload ?? []);
    } catch {
      setError("Network error loading settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  /** PATCH a single setting's value. Called by each card's Save button. */
  async function updateSettingValue(setting: Setting, value: string) {
    try {
      const res = await fetch(
        `${API_URL}/settings/${encodeURIComponent(setting.settingKey)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.payload?.message ?? json?.message ?? "Update failed.";
        toast.error(msg);
        return;
      }
      setSettings((current) =>
        current.map((item) =>
          item.id === setting.id
            ? { ...item, settingValue: value, updatedAt: new Date().toISOString() }
            : item,
        ),
      );
      toast.success(`${humanizeKey(setting.settingKey)} updated.`);
    } catch {
      toast.error("Network error.");
    }
  }

  /** POST a new setting (from the Add sheet). */
  async function handleSubmit() {
    if (!form.key.trim() || !form.value.trim()) {
      setFormError("Key and value are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: form.key.trim(),
          value: form.value.trim(),
          type: form.type,
          description: form.description,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(json?.payload?.message ?? json?.message ?? "Operation failed.");
        return;
      }
      toast.success("Setting created.");
      setSheetOpen(false);
      setForm(defaultForm);
      await load();
    } catch {
      setFormError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  /** DELETE — fired after the confirmation dialog is accepted. */
  async function performDelete(key: string) {
    setDeletingKey(key);
    setConfirmDeleteKey(null);
    try {
      const res = await fetch(
        `${API_URL}/settings/${encodeURIComponent(key)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json?.payload?.message ?? json?.message ?? "Delete failed.");
        return;
      }
      setSettings((current) => current.filter((s) => s.settingKey !== key));
      toast.success(`${humanizeKey(key)} deleted.`);
    } catch {
      toast.error("Network error.");
    } finally {
      setDeletingKey(null);
    }
  }

  function openAdd() {
    setForm(defaultForm);
    setFormError("");
    setSheetOpen(true);
  }

  return (
    <div className="px-4 sm:px-5 py-6 sm:py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings2Icon className="size-7 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">System Settings</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Tune attendance rules with simple controls. Changes apply across all sessions.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90">
          <PlusIcon className="size-4" />
          Add Setting
        </Button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <LoaderCircleIcon className="size-8 animate-spin text-primary" />
        </div>
      ) : settings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-20 text-center text-muted-foreground/70">
          <Settings2Icon className="mx-auto mb-3 size-10 opacity-40" />
          <p className="font-medium">No settings configured.</p>
          <p className="mt-1 text-base">Click Add Setting to create the first one.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedSettings).map(([group, groupSettings]) => (
            <section key={group} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{group}</h2>
                <Badge variant="outline">{groupSettings.length} options</Badge>
              </div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {groupSettings.map((setting) => (
                  <SettingOptionCard
                    key={`${setting.id}-${setting.settingValue}`}
                    setting={setting}
                    deleting={deletingKey === setting.settingKey}
                    onSave={updateSettingValue}
                    onDelete={(k) => setConfirmDeleteKey(k)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Add Setting sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>Add New Setting</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-1">
            <div className="space-y-1.5">
              <Label htmlFor="s-key">
                Key <span className="text-red-500">*</span>
              </Label>
              <Input
                id="s-key"
                placeholder="e.g. late_threshold_minutes"
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-type">Type</Label>
              <select
                id="s-type"
                value={form.type}
                onChange={(e) => {
                  const t = e.target.value;
                  setForm((f) => ({
                    ...f,
                    type: t,
                    value: t === "BOOLEAN" ? "true" : "",
                  }));
                }}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="STRING">STRING</option>
                <option value="INT">INT</option>
                <option value="BOOLEAN">BOOLEAN</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-value">
                Value <span className="text-red-500">*</span>
              </Label>
              <ValueField
                type={form.type}
                value={form.value}
                onChange={(v) => setForm((f) => ({ ...f, value: v }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-desc">Description</Label>
              <Input
                id="s-desc"
                placeholder="Optional description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            {formError && (
              <p className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/40 px-3 py-2 text-sm text-red-600 dark:text-red-300">
                {formError}
              </p>
            )}

            <div className="mt-2 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting && (
                  <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
                )}
                Create
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm dialog */}
      <AlertDialog
        open={confirmDeleteKey !== null}
        onOpenChange={(o) => !o && setConfirmDeleteKey(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {confirmDeleteKey ? humanizeKey(confirmDeleteKey) : "setting"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the setting and its value. Any feature that
              depends on it will fall back to its default. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteKey && performDelete(confirmDeleteKey)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
