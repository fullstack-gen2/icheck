"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { LoaderCircleIcon } from "lucide-react";
import { api } from "@/lib/api-client";
import { useGetTeachersQuery } from "@/store/api/userApi";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;

export interface ScheduleFormValue {
  id?: number;
  className: string;
  subjectName: string;
  teacherName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slot: number;
  status: boolean;
}

const empty: ScheduleFormValue = {
  className:   "",
  subjectName: "",
  teacherName: "",
  dayOfWeek:   "MONDAY",
  startTime:   "08:00",
  endTime:     "10:00",
  slot:        1,
  status:      true,
};

interface ClassroomOpt { id: number; className: string; }

interface Props {
  open: boolean;
  initial?: ScheduleFormValue | null;
  classrooms?: ClassroomOpt[];
  onOpenChange: (o: boolean) => void;
}

export function ScheduleFormDialog({ open, initial, classrooms = [], onOpenChange }: Props) {
  const router = useRouter();
  const editing = !!initial?.id;
  const { data: teachers = [], isLoading: loadingTeachers } = useGetTeachersQuery();
  const [form, setForm] = useState<ScheduleFormValue>(empty);
  const [saving, setSaving] = useState(false);

  const teacherOptions = useMemo(() => {
    const names = new Set(teachers.map((teacher) => teacher.name).filter(Boolean));
    if (form.teacherName && !names.has(form.teacherName)) names.add(form.teacherName);
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [form.teacherName, teachers]);

  useEffect(() => {
    if (open) setForm(initial ? { ...empty, ...initial } : empty);
  }, [open, initial]);

  function patch<K extends keyof ScheduleFormValue>(k: K, v: ScheduleFormValue[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.className.trim() || !form.subjectName.trim() || !form.teacherName.trim()) {
      toast.error("Class, subject and teacher are required.");
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error("End time must be after start time.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        className:   form.className.trim(),
        subjectName: form.subjectName.trim(),
        teacherName: form.teacherName.trim(),
        dayOfWeek:   form.dayOfWeek,
        startTime:   form.startTime.length === 5 ? form.startTime + ":00" : form.startTime,
        endTime:     form.endTime.length === 5   ? form.endTime + ":00"   : form.endTime,
        slot:        Number(form.slot),
        status:      form.status,
      };
      if (editing) {
        await api.patch(`/schedules/${form.id}`, body);
        toast.success("Schedule updated.");
      } else {
        await api.post(`/schedules`, body);
        toast.success("Schedule created.");
      }
      onOpenChange(false);
      router.refresh();
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
          <DialogTitle>{editing ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
          <DialogDescription>
            Recurring weekly slot for a class.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Class" required>
            {classrooms.length > 0 ? (
              <Select value={form.className} onValueChange={(v) => patch("className", v)}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classrooms.map((c) => (
                    <SelectItem key={c.id} value={c.className}>{c.className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.className} onChange={(e) => patch("className", e.target.value)} />
            )}
          </Field>

          <Field label="Subject" required>
            <Input
              value={form.subjectName}
              onChange={(e) => patch("subjectName", e.target.value)}
              placeholder="e.g. Web Development"
            />
          </Field>

          <Field label="Teacher" required>
            {teacherOptions.length > 0 ? (
              <Select value={form.teacherName} onValueChange={(v) => patch("teacherName", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingTeachers ? "Loading teachers..." : "Select teacher"} />
                </SelectTrigger>
                <SelectContent>
                  {teacherOptions.map((teacherName) => (
                    <SelectItem key={teacherName} value={teacherName}>
                      {teacherName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.teacherName}
                onChange={(e) => patch("teacherName", e.target.value)}
                placeholder={loadingTeachers ? "Loading teachers..." : "Teacher's full name"}
              />
            )}
          </Field>

          <Field label="Day">
            <Select value={form.dayOfWeek} onValueChange={(v) => patch("dayOfWeek", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Start Time">
            <Input
              type="time"
              value={form.startTime}
              onChange={(e) => patch("startTime", e.target.value)}
            />
          </Field>
          <Field label="End Time">
            <Input
              type="time"
              value={form.endTime}
              onChange={(e) => patch("endTime", e.target.value)}
            />
          </Field>

          <Field label="Slot">
            <Input
              type="number"
              min={1}
              value={form.slot}
              onChange={(e) => patch("slot", Number(e.target.value))}
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
