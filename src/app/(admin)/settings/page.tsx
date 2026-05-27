"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Settings2Icon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  LoaderCircleIcon,
} from "lucide-react";

interface Setting {
  id: number;
  settingKey: string;
  settingValue: string;
  type: string;
  description: string | null;
  updatedAt: string | null;
}

const KEY_LABELS: Record<string, string> = {
  early_checkin_minutes:             "Early check-in window (minutes)",
  late_threshold_minutes:            "Late threshold (minutes)",
  student_attendance_cutoff_minutes: "Student attendance cut-off (minutes)",
  teacher_edit_deadline_minutes:     "Teacher correction deadline (minutes)",
  qr_expire_seconds:                 "QR code expiry (seconds)",
  gps_allowed_radius_meters:         "GPS allowed radius (meters)",
  max_sessions_per_day:              "Maximum sessions per day",
  attendance_reminder_enabled:       "Attendance reminder enabled",
};

/** Best-effort prettifier for keys not in the explicit map. */
function humanizeKey(key: string): string {
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

type SheetMode = "add" | "edit";
const defaultForm = { key: "", value: "", type: "STRING", description: "" };

/** Value field — renders a boolean select or plain text input depending on type */
function ValueField({
  type,
  value,
  onChange,
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
        className="w-full border border-input rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#273C97]/30 bg-white"
      >
        <option value="true">true</option>
        <option value="false">false</option>
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("add");
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/attendance/settings`);
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

  function openAdd() {
    setForm(defaultForm);
    setFormError("");
    setSheetMode("add");
    setSheetOpen(true);
  }

  function openEdit(s: Setting) {
    setForm({ key: s.settingKey, value: s.settingValue, type: s.type, description: s.description ?? "" });
    setFormError("");
    setSheetMode("edit");
    setSheetOpen(true);
  }

  async function handleSubmit() {
    if (!form.key.trim() || !form.value.trim()) {
      setFormError("Key and value are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      let res: Response;
      if (sheetMode === "add") {
        res = await fetch(`/attendance/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: form.key.trim(), value: form.value.trim(), type: form.type, description: form.description }),
        });
      } else {
        res = await fetch(`/attendance/settings/${encodeURIComponent(form.key)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: form.value.trim() }),
        });
      }
      const json = await res.json();
      if (!res.ok) { setFormError(json?.payload?.message ?? json?.message ?? "Operation failed."); return; }
      setSheetOpen(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(key: string) {
    if (!confirm(`Delete setting "${key}"? This cannot be undone.`)) return;
    setDeletingKey(key);
    try {
      const res = await fetch(`/attendance/settings/${encodeURIComponent(key)}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.payload?.message ?? json?.message ?? "Delete failed.");
        return;
      }
      await load();
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <div className="px-5 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Global configuration keys used across all sessions.</p>
        </div>
        <Button className="bg-[#273C97] hover:bg-[#1e2e7a] gap-2" onClick={openAdd}>
          <PlusIcon className="size-4" />
          Add Setting
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <LoaderCircleIcon className="size-8 animate-spin text-[#273C97]" />
        </div>
      ) : settings.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <Settings2Icon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No settings configured.</p>
          <p className="text-sm mt-1">Click `Add Setting` to create the first one.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="px-4 py-3 text-gray-600 font-semibold">Setting</TableHead>
                <TableHead className="px-4 py-3 text-gray-600 font-semibold">Value</TableHead>
                <TableHead className="px-4 py-3 text-gray-600 font-semibold hidden md:table-cell">Description</TableHead>
                <TableHead className="px-4 py-3 text-gray-600 font-semibold hidden lg:table-cell">Updated</TableHead>
                <TableHead className="px-4 py-3 text-right text-gray-600 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((s) => (
                <TableRow key={s.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="px-4 py-3">
                    {/* Friendly label first, raw key as a small caption underneath
                        so admins who know the key by name still recognize it. */}
                    <div className="font-medium text-gray-900">{humanizeKey(s.settingKey)}</div>
                    <div className="font-mono text-[11px] text-gray-400 mt-0.5">{s.settingKey}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {s.type === "BOOLEAN" ? (
                      <Badge className={s.settingValue === "true"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-100"
                      }>
                        {s.settingValue === "true" ? "Enabled" : "Disabled"}
                      </Badge>
                    ) : (
                      <span className="font-semibold text-gray-900">{s.settingValue}</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-sm hidden md:table-cell">
                    <span className="block max-w-xs">{s.description ?? "—"}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell whitespace-nowrap">
                    {s.updatedAt
                      ? new Date(s.updatedAt).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })
                      : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-[#273C97] hover:bg-[#273C97]/10"
                        onClick={() => openEdit(s)}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-red-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDelete(s.settingKey)}
                        disabled={deletingKey === s.settingKey}
                      >
                        {deletingKey === s.settingKey
                          ? <LoaderCircleIcon className="size-4 animate-spin" />
                          : <TrashIcon className="size-4" />
                        }
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {sheetMode === "add" ? "Add New Setting" : `Edit — ${humanizeKey(form.key)}`}
            </SheetTitle>
            {/* Show the underlying database key on edit so the admin still
                knows which row they're touching. */}
            {sheetMode === "edit" && (
              <p className="font-mono text-xs text-gray-400">{form.key}</p>
            )}
          </SheetHeader>

          <div className="flex flex-col gap-4">
            {/* Key — read-only when editing */}
            <div className="space-y-1.5">
              <Label htmlFor="s-key">
                Key <span className="text-red-500">*</span>
              </Label>
              <Input
                id="s-key"
                placeholder="e.g. late_threshold_minutes"
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                readOnly={sheetMode === "edit"}
                className={`font-mono ${sheetMode === "edit" ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
              />
            </div>

            {/* Type — only for add */}
            {sheetMode === "add" && (
              <div className="space-y-1.5">
                <Label htmlFor="s-type">Type</Label>
                <select
                  id="s-type"
                  value={form.type}
                  onChange={(e) => {
                    const t = e.target.value;
                    setForm((f) => ({ ...f, type: t, value: t === "BOOLEAN" ? "true" : "" }));
                  }}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#273C97]/30 bg-white"
                >
                  <option value="STRING">STRING</option>
                  <option value="INT">INT</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                </select>
              </div>
            )}

            {/* Value — boolean gets select, others get input */}
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

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="s-desc">Description</Label>
              <Input
                id="s-desc"
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#273C97] hover:bg-[#1e2e7a]"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting && <LoaderCircleIcon className="size-4 animate-spin mr-2" />}
                {sheetMode === "add" ? "Create" : "Save Changes"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
