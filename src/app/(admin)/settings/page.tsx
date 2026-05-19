"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Settings2Icon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
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
  INT: "bg-blue-100 text-blue-700",
  BOOLEAN: "bg-purple-100 text-purple-700",
  STRING: "bg-gray-100 text-gray-600",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // New setting form
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState("STRING");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      setSettings(json?.payload ?? []);
    } catch {
      setError("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(key: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/settings/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: editValue }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json?.message ?? "Update failed.");
        return;
      }
      setEditingKey(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(key: string) {
    if (!confirm(`Delete setting "${key}"?`)) return;
    try {
      const res = await fetch(`/api/settings/${encodeURIComponent(key)}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json?.message ?? "Delete failed.");
        return;
      }
      await load();
    } catch {
      setError("Delete failed.");
    }
  }

  async function handleAdd() {
    if (!newKey.trim() || !newValue.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey.trim(), value: newValue.trim(), type: newType, description: newDesc }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json?.message ?? "Create failed.");
        return;
      }
      setShowAdd(false);
      setNewKey(""); setNewValue(""); setNewType("STRING"); setNewDesc("");
      await load();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="px-5 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-black">System Settings</h1>
        <Button
          size="sm"
          className="bg-[#273C97] hover:bg-[#1e2e7a] gap-1.5"
          onClick={() => setShowAdd((v) => !v)}
        >
          <PlusIcon className="size-4" />
          Add Setting
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-[#273C97]/30 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">New Setting</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Key *</label>
              <Input
                placeholder="e.g. late_threshold_minutes"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Value *</label>
              <Input
                placeholder="e.g. 10"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#273C97]/30"
              >
                <option value="STRING">STRING</option>
                <option value="INT">INT</option>
                <option value="BOOLEAN">BOOLEAN</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <Input
                placeholder="Optional description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#273C97] hover:bg-[#1e2e7a]"
              onClick={handleAdd}
              disabled={adding || !newKey.trim() || !newValue.trim()}
            >
              {adding ? <LoaderCircleIcon className="size-4 animate-spin" /> : "Create"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoaderCircleIcon className="size-8 animate-spin text-[#273C97]" />
        </div>
      ) : settings.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <Settings2Icon className="size-10 mx-auto mb-3 opacity-40" />
          <p>No settings configured.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Key</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Value</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Description</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((s, index) => (
                <tr
                  key={s.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index === settings.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-700">{s.settingKey}</span>
                  </td>
                  <td className="px-4 py-3">
                    {editingKey === s.settingKey ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 text-sm w-32"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSave(s.settingKey);
                          if (e.key === "Escape") setEditingKey(null);
                        }}
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{s.settingValue}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge className={`text-[10px] ${typeColor[s.type] ?? "bg-gray-100 text-gray-500"}`}>
                      {s.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell max-w-xs truncate">
                    {s.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {editingKey === s.settingKey ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-green-600 hover:bg-green-50"
                            onClick={() => handleSave(s.settingKey)}
                            disabled={saving}
                          >
                            {saving ? (
                              <LoaderCircleIcon className="size-3.5 animate-spin" />
                            ) : (
                              <CheckIcon className="size-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-gray-400 hover:bg-gray-100"
                            onClick={() => setEditingKey(null)}
                          >
                            <XIcon className="size-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-[#273C97] hover:bg-[#273C97]/10"
                            onClick={() => { setEditingKey(s.settingKey); setEditValue(s.settingValue); }}
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-red-400 hover:bg-red-50"
                            onClick={() => handleDelete(s.settingKey)}
                          >
                            <TrashIcon className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
