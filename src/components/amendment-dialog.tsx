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
  id: number | string;
  name: string;
  /** Current status from the SSR roster (lower-case "present", "late",
   *  "pending", …). Used to seed each row's select and to skip rows where the
   *  teacher made no change at submit time. */
  currentStatus?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: AmendmentDialogStudent[];
  sessionId: number | null;
  onSaved?: () => void;
}

type Stage = "reason" | "list";

const STATUS_OPTIONS = [
  { value: "PRESENT",  label: "Present" },
  { value: "LATE",     label: "Late" },
  { value: "LATE_OUT", label: "Late Out" },
  { value: "ABSENT",   label: "Absent" },
];

/** Lower-case roster status → backend enum value. Used to seed each row from
 *  whatever the SSR fetched, so "the value already there" matches an option. */
function toEnumStatus(raw?: string): string {
  if (!raw) return "PRESENT";
  const up = raw.toUpperCase();
  return STATUS_OPTIONS.some((o) => o.value === up) ? up : "PRESENT";
}

/**
 * Teacher manual amendment — two-stage flow:
 *
 *   Stage 1 ("reason"): teacher types ONE reason that will be attached to
 *     every status change in this batch (e.g. "QR was offline, attendance
 *     taken from the paper sheet").
 *
 *   Stage 2 ("list"): full student roster with a per-row status select. The
 *     teacher tweaks whichever rows changed, leaves the rest, and clicks Save.
 *     Only rows whose status differs from the SSR snapshot get a backend call;
 *     unchanged rows are skipped so the audit log stays clean.
 *
 * Each row that DID change posts to /amendments/teacher-amend-by-student,
 * which:
 *   - creates the Attendance row if the student never scanned,
 *   - flips the status to the chosen value,
 *   - writes an APPROVED Amendment for the audit trail,
 *   - notifies the student,
 *   - broadcasts a live update.
 */
export function AmendmentDialog({
  open,
  onOpenChange,
  students,
  sessionId,
  onSaved,
}: Props) {
  const user = useUser();

  const [stage, setStage] = useState<Stage>("reason");
  const [reason, setReason] = useState("");
  // Map keyed by `${id}` so we don't depend on numeric vs string id consistency.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset whenever the dialog reopens — adjusting state during render avoids
  // the cascading-render set-state-in-effect rule.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStage("reason");
      setReason("");
      const seed: Record<string, string> = {};
      for (const s of students) seed[String(s.id)] = toEnumStatus(s.currentStatus);
      setDrafts(seed);
    }
  }

  function advanceToList() {
    if (!sessionId) {
      toast.error("No session is open for this class right now.");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Reason is required (at least 3 characters).");
      return;
    }
    setStage("list");
  }

  function patchDraft(id: string | number, status: string) {
    setDrafts((prev) => ({ ...prev, [String(id)]: status }));
  }

  async function handleSave() {
    if (!sessionId) {
      toast.error("No session is open for this class right now.");
      return;
    }
    if (!user?.id) {
      toast.error("Could not identify the current teacher.");
      return;
    }

    // Diff against the SSR snapshot — skip rows the teacher didn't touch so
    // we don't spam the audit log with no-op amendments.
    const changed = students.filter((s) => {
      const next = drafts[String(s.id)];
      const before = toEnumStatus(s.currentStatus);
      return next && next !== before;
    });

    if (changed.length === 0) {
      toast.info("No status changes to save.");
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      // Fire serially so the backend write order matches the row order — easier
      // for an admin to follow in the amendment timeline later.
      const failures: string[] = [];
      for (const s of changed) {
        try {
          await api.post("/amendments/teacher-amend-by-student", {
            teacherId: Number(user.id),
            studentId: Number(s.id),
            sessionId,
            newStatus: drafts[String(s.id)],
            reason: reason.trim(),
          });
        } catch (e) {
          failures.push(`${s.name}: ${getErrorMessage(e, "save failed")}`);
        }
      }

      if (failures.length === 0) {
        toast.success(`Updated ${changed.length} student${changed.length === 1 ? "" : "s"}.`);
        onOpenChange(false);
        onSaved?.();
      } else if (failures.length < changed.length) {
        toast.warning(
          `Saved ${changed.length - failures.length}, but ${failures.length} failed.`,
          { description: failures.slice(0, 3).join("\n") },
        );
        onSaved?.();
      } else {
        toast.error("Could not save any amendment.", {
          description: failures.slice(0, 3).join("\n"),
        });
      }
    } finally {
      setSaving(false);
    }
  }

  const changedCount = students.reduce((acc, s) => {
    const next = drafts[String(s.id)];
    const before = toEnumStatus(s.currentStatus);
    return next && next !== before ? acc + 1 : acc;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={stage === "list" ? "sm:max-w-2xl" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>
            {stage === "reason" ? "Amendment Reason" : "Amend Attendance"}
          </DialogTitle>
          <DialogDescription>
            {stage === "reason"
              ? "Give one reason for this batch of changes — it gets attached to every status you adjust on the next screen."
              : `Adjust each student's status, then save. Reason: “${reason}”.`}
          </DialogDescription>
        </DialogHeader>

        {stage === "reason" ? (
          <div className="grid gap-3">
            <Field label="Reason" required>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. QR was offline — attendance taken from paper sheet"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground/70">
                Stored on every amendment row so admins can audit later.
              </p>
            </Field>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/40">
            {students.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No students in this class.
              </div>
            ) : (
              students.map((s) => {
                const draft = drafts[String(s.id)] ?? toEnumStatus(s.currentStatus);
                const before = toEnumStatus(s.currentStatus);
                const changed = draft !== before;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 px-3 py-2 ${
                      changed ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground/70">
                        Current: {s.currentStatus ?? "pending"}
                      </p>
                    </div>
                    <Select
                      value={draft}
                      onValueChange={(v) => patchDraft(s.id, v)}
                    >
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {stage === "reason" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={advanceToList}
                disabled={reason.trim().length < 3 || !sessionId}
              >
                Next: Edit Students
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStage("reason")}
                disabled={saving}
              >
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
                Save Changes
                {changedCount > 0 ? (
                  <span className="ml-1 text-xs opacity-80">({changedCount})</span>
                ) : null}
              </Button>
            </>
          )}
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
