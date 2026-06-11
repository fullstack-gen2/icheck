"use client";

import { useState } from "react";
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
import { LoaderCircleIcon, PlusIcon } from "lucide-react";
import { useCreateTeacherMutation, useUpdateTeacherMutation } from "@/store/api/userApi";
import { getErrorMessage } from "@/lib/error-utils";

export interface TeacherFormValue {
  id?: number;
  name: string;
  email: string;
  phone: string;
  specialization: string;
}

const empty: TeacherFormValue = {
  name: "",
  email: "",
  phone: "",
  specialization: "",
};

interface Props {
  open: boolean;
  initial?: TeacherFormValue | null;
  onOpenChange: (o: boolean) => void;
}

export function TeacherFormDialog({ open, initial, onOpenChange }: Props) {
  const editing = !!initial?.id;
  const [createTeacher, { isLoading: creating }] = useCreateTeacherMutation();
  const [updateTeacher, { isLoading: updating }] = useUpdateTeacherMutation();
  const [form, setForm] = useState<TeacherFormValue>(empty);

  // Reset the form whenever the dialog transitions to open (adjusting state
  // during render avoids the cascading-render set-state-in-effect pitfall).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setForm(initial ? { ...empty, ...initial } : empty);
  }

  function patch<K extends keyof TeacherFormValue>(k: K, v: TeacherFormValue[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    try {
      if (editing && form.id) {
        await updateTeacher({
          id: form.id,
          body: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            specialization: form.specialization.trim() || null,
          },
        }).unwrap();
        toast.success("Teacher updated.");
      } else {
        await createTeacher({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          specialization: form.specialization.trim() || null,
        }).unwrap();
        toast.success("Teacher registered.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e, editing ? "Could not update teacher." : "Could not register teacher."));
    }
  }

  const saving = creating || updating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Teacher" : "Register Teacher"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update this teacher's details." : "Create a teacher account from live API data."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Full name" required>
            <Input
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
              placeholder="Full name"
            />
          </Field>
          <Field label="Email" required>
            <Input
              value={form.email}
              onChange={(e) => patch("email", e.target.value)}
              placeholder="Email"
              type="email"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => patch("phone", e.target.value)}
                placeholder="Phone"
              />
            </Field>
            <Field label="Specialization">
              <Input
                value={form.specialization}
                onChange={(e) => patch("specialization", e.target.value)}
                placeholder="e.g. Frontend"
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <LoaderCircleIcon className="size-4 animate-spin" /> : <PlusIcon className="size-4" />}
            {editing ? "Save Changes" : "Register"}
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
