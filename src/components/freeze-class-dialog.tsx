"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { SnowflakeIcon, LoaderCircleIcon } from "lucide-react";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error-utils";

interface Props {
  /** When set → freeze this one class (CLASSROOM scope). When omitted → the
   *  dialog offers a GLOBAL freeze (all classes). */
  classroomId?: number;
  className?: string;
}

/**
 * Admin "Freeze" — declares a holiday so attendance stops counting that day.
 * Posts a HOLIDAY calendar event; the backend also cancels any session already
 * generated for the date/scope, so live QR + check-in are blocked. Sessions are
 * skipped by the daily generator on holidays, so future days are covered too.
 */
export function FreezeClassDialog({ classroomId, className }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scope, setScope] = useState<"CLASSROOM" | "GLOBAL">(classroomId ? "CLASSROOM" : "GLOBAL");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleFreeze() {
    if (!date) {
      toast.error("Pick a date to freeze.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/calendar", {
        date,
        type: "HOLIDAY",
        scope,
        classroomId: scope === "CLASSROOM" ? classroomId ?? null : null,
        label: label.trim() || (scope === "GLOBAL" ? "School holiday" : `Frozen: ${className ?? "class"}`),
      });
      toast.success(
        scope === "GLOBAL"
          ? "All classes frozen for that day."
          : `${className ?? "Class"} frozen for that day.`,
      );
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not freeze."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="p-5 gap-1.5">
          <SnowflakeIcon className="size-4" /> Freeze
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Freeze Attendance</DialogTitle>
          <DialogDescription>
            Mark a day as a holiday / special case. No attendance is counted —
            sessions for that day are cancelled and none are generated.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Field label="Date" required>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>

          <Field label="Scope" required>
            <Select value={scope} onValueChange={(v) => setScope(v as "CLASSROOM" | "GLOBAL")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {classroomId && (
                  <SelectItem value="CLASSROOM">This class only{className ? ` (${className})` : ""}</SelectItem>
                )}
                <SelectItem value="GLOBAL">All classes (whole school)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Reason / label">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Public holiday, exam day…"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleFreeze} disabled={saving} className="gap-1.5">
            {saving ? <LoaderCircleIcon className="size-4 animate-spin" /> : <SnowflakeIcon className="size-4" />}
            Freeze Day
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
