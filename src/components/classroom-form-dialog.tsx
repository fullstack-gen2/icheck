"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderCircleIcon } from "lucide-react";
import { api } from "@/lib/api-client";
import { todayIso } from "@/lib/school-time";

export interface ClassroomFormValue {
  id?: number;
  className: string;
  classCode: string;
  programTypeName: string;
  generation: number;
  year?: number | null;
  semester?: number | null;
  shift: string;
  academicYear: number;
  startDate: string;
  endDate: string;
  status: boolean;
}

const SHIFTS  = ["MORNING", "AFTERNOON", "EVENING"];
const PROGRAMS = ["Bachelor", "Scholarship"]; // tweak to match your real list

interface Props {
  open: boolean;
  initial?: ClassroomFormValue | null;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
}

const empty: ClassroomFormValue = {
  className: "",
  classCode: "",
  programTypeName: "Bachelor",
  generation: 1,
  year: 1,
  semester: 1,
  shift: "MORNING",
  academicYear: new Date().getFullYear(),
  // school local date, not UTC — same reason as schedule/page.tsx
  startDate: todayIso(),
  endDate: todayIso(),
  status: true,
};

export function ClassroomFormDialog({ open, initial, onOpenChange, onSaved }: Props) {
  const editing = !!initial?.id;
  const [form, setForm] = useState<ClassroomFormValue>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial ? { ...empty, ...initial } : empty);
  }, [open, initial]);

  const isScholarship = /scholarship/i.test(form.programTypeName);

  function patch<K extends keyof ClassroomFormValue>(k: K, v: ClassroomFormValue[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.className.trim() || !form.classCode.trim()) {
      toast.error("Class name and code are required.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        className:        form.className.trim(),
        classCode:        form.classCode.trim(),
        programTypeName:  form.programTypeName,
        generation:       Number(form.generation),
        year:             isScholarship ? null : Number(form.year),
        semester:         isScholarship ? null : Number(form.semester),
        shift:            form.shift,
        academicYear:     Number(form.academicYear),
        startDate:        form.startDate,
        endDate:          form.endDate,
        status:           form.status,
      };
      if (editing) {
        await api.patch(`/classrooms/${form.id}`, body);
        toast.success("Class updated.");
      } else {
        await api.post(`/classrooms`, body);
        toast.success("Class created.");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Class" : "Create Class"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update this classroom's information." : "Add a new classroom to the system."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Class Name" required>
            <Input
              value={form.className}
              onChange={(e) => patch("className", e.target.value)}
              placeholder="e.g. Web Dev Y2 G6"
            />
          </Field>
          <Field label="Class Code" required>
            <Input
              value={form.classCode}
              onChange={(e) => patch("classCode", e.target.value)}
              placeholder="e.g. WD-Y2-G6"
              className="font-mono"
            />
          </Field>

          <Field label="Program">
            <Select
              value={form.programTypeName}
              onValueChange={(v) => patch("programTypeName", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROGRAMS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Shift">
            <Select
              value={form.shift}
              onValueChange={(v) => patch("shift", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SHIFTS.map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Generation">
            <Input
              type="number"
              value={form.generation}
              onChange={(e) => patch("generation", Number(e.target.value))}
            />
          </Field>
          <Field label="Academic Year">
            <Input
              type="number"
              value={form.academicYear}
              onChange={(e) => patch("academicYear", Number(e.target.value))}
            />
          </Field>

          {!isScholarship && (
            <>
              <Field label="Year">
                <Input
                  type="number"
                  value={form.year ?? ""}
                  onChange={(e) => patch("year", e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
              <Field label="Semester">
                <Input
                  type="number"
                  value={form.semester ?? ""}
                  onChange={(e) => patch("semester", e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
            </>
          )}

          <Field label="Start Date">
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => patch("startDate", e.target.value)}
            />
          </Field>
          <Field label="End Date">
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => patch("endDate", e.target.value)}
            />
          </Field>

          <Field label="Status">
            <Select
              value={form.status ? "active" : "inactive"}
              onValueChange={(v) => patch("status", v === "active")}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <LoaderCircleIcon className="size-4 animate-spin mr-2" />}
            {editing ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
