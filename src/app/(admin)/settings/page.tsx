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

const typeColor: Record<string, string> = {
  INT: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  BOOLEAN: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  STRING: "bg-gray-100 text-gray-600 hover:bg-gray-100",
};

type SheetMode = "add" | "edit";

const defaultForm = { key: "", value: "", type: "STRING", description: "" };

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
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (!res.ok) { setError("Failed to load settings."); return; }
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
        res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: form.key.trim(), value: form.value.trim(), type: form.type, description: form.description }),
        });
      } else {
        res = await fetch(`/api/settings/${encodeURIComponent(form.key)}`, {
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
      const res = await fetch(`/api/settings/${encodeURIComponent(key)}`, { method: "DELETE" });
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
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage global configuration keys used by the system.</p>
        </div>
        <Button
          className="bg-[#273C97] hover:bg-[#1e2e7a] gap-2"
          onClick={openAdd}
        >
          <PlusIcon className="size-4" />
          Add Setting
        </Button>
      </div>

      {/* Global error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-24">
          <LoaderCircleIcon className="size-8 animate-spin text-[#273C97]" />
        </div>
      ) : settings.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <Settings2Icon className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No settings configured.</p>
          <p className="text-sm mt-1">Click "Add Setting" to create the first one.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="px-4 py-3 text-gray-600 font-semibold">Key</TableHead>
                <TableHead className="px-4 py-3 text-gray-600 font-semibold">Value</TableHead>
                <TableHead className="px-4 py-3 text-gray-600 font-semibold">Type</TableHead>
                <TableHead className="px-4 py-3 text-gray-600 font-semibold hidden md:table-cell">Description</TableHead>
                <TableHead className="px-4 py-3 text-gray-600 font-semibold hidden lg:table-cell">Last updated</TableHead>
                <TableHead className="px-4 py-3 text-right text-gray-600 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((s) => (
                <TableRow key={s.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-800">{s.settingKey}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="font-semibold text-gray-900">{s.settingValue}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={`text-xs ${typeColor[s.type] ?? "bg-gray-100 text-gray-500"}`}>
                      {s.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell max-w-xs">
                    <span className="truncate block">{s.description ?? "—"}</span>
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
                        {deletingKey === s.settingKey ? (
                          <LoaderCircleIcon className="size-4 animate-spin" />
                        ) : (
                          <TrashIcon className="size-4" />
                        )}
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
            <SheetTitle>{sheetMode === "add" ? "Add New Setting" : `Edit — ${form.key}`}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4">
            {/* Key — read-only when editing */}
            <div className="space-y-1.5">
              <Label htmlFor="key">Key <span className="text-red-500">*</span></Label>
              <Input
                id="key"
                placeholder="e.g. late_threshold_minutes"
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                readOnly={sheetMode === "edit"}
                className={`font-mono ${sheetMode === "edit" ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
              />
            </div>

            {/* Value */}
            <div className="space-y-1.5">
              <Label htmlFor="value">Value <span className="text-red-500">*</span></Label>
              <Input
                id="value"
                placeholder="e.g. 10"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              />
            </div>

            {/* Type — only for add */}
            {sheetMode === "add" && (
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#273C97]/30 bg-white"
                >
                  <option value="STRING">STRING</option>
                  <option value="INT">INT</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                </select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Form error */}
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#273C97] hover:bg-[#1e2e7a]"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <LoaderCircleIcon className="size-4 animate-spin mr-2" />
                ) : null}
                {sheetMode === "add" ? "Create" : "Save Changes"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
