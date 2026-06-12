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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderCircleIcon } from "lucide-react";
import { useUser } from "@/components/user-provider";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error-utils";

export interface AmendmentDialogStudent {
  /** Local DB user id (Number). */
  id: number | string;
  name: string;
  /** Current status from the list, lower-case ("present", "late", "pending"…). */
  currentStatus?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: AmendmentDialogStudent[];
  sessionId: number | null;
  onSaved?: () => void;
}

// Statuses the teacher can manually choose. PRESENT, LATE, LATE_OUT, ABSENT
// match the backend enum exactly; PERMISSION is mapped to ABSENT for now
// because no PERMISSION enum exists in the codebase yet (closest match for
// "excused absence").
const STATUS_OPTIONS = [
  { value: "PRESENT",  label: "Present" },
  { value: "LATE",     label: "Late" },
  { value: "LATE_OUT", label: "Late Out" },
  { value: "ABSENT",   label: "Absent" },
];

/**
 * Teacher manual amendment form — opens from the "Amendment" button on the
 * checked-attendance / take-attendance pages. The teacher picks a student,
 * a new status, and types a reason. Submit hits `/amendments/teacher-amend-by-student`
 * which:
 *   1. creates the attendance row if the student never scanned,
 *   2. updates the status to the chosen value,
 *   3. writes an APPROVED Amendment row for the audit trail,
 *   4. notifies the student,
 *   5. broadcasts a live update so the table updates in place (no refresh).
 *
 * No admin approval is required — per the system rules, teacher amendments
 * land immediately.
 */
export function AmendmentDialog({
  open,
  onOpenChange,
  students,
  sessionId,
  onSaved,
}: Props) {
  const user = useUser();
  const [studentId, setStudentId] = useState<string>("");
  const [status, setStatus] = useState<string>("PRESENT");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset the form whenever the dialog re-opens (adjust state during render —
  // safer than useEffect for this pattern and avoids the cascading-render
  // lint hit we've fought elsewhere).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStudentId("");
      setStatus("PRESENT");
      setReason("");
    }
  }

  async function handleSave() {
    if (!sessionId) {
      toast.error("No session is open for this class right now.");
      return;
    }
    if (!studentId) {
      toast.error("Pick a student first.");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Reason is required (at least 3 characters).");
      return;
    }
    if (!user?.id) {
      toast.error("Could not identify the current teacher.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/amendments/teacher-amend-by-student", {
        teacherId: Number(user.id),
        studentId: Number(studentId),
        sessionId,
        newStatus: status,
        reason: reason.trim(),
      });
      toast.success("Attendance updated.");
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not save the amendment."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Amend Attendance</DialogTitle>
          <DialogDescription>
            Manually update a student&apos;s attendance for today&apos;s session.
            Takes effect immediately — no admin approval required.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Field label="Student" required>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a student" />
              </SelectTrigger>
              <SelectContent>
                {students.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No students.</div>
                )}
                {students.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                    {s.currentStatus ? (
                      <span className="ml-2 text-xs text-muted-foreground/70">
                        ({s.currentStatus})
                      </span>
                    ) : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="New status" required>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Reason" required>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Doctor's appointment, manual correction…"
            />
            <p className="text-[11px] text-muted-foreground/70">
              Stored on the amendment record so admins can audit later.
            </p>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
            Save Amendment
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
