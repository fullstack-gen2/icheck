"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderCircleIcon } from "lucide-react";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error-utils";
import { useUser } from "@/components/user-provider";
import { useGetUserEnrollmentsQuery } from "@/store/api/userApi";

/**
 * Student "Request Permission" / "Submit Late Reason" form.
 *
 * Posts to `/api/v1/amendments/late-out`, which is the backend's existing
 * student-facing path:
 *   - input: studentId, sessionId, leaveTime, reason
 *   - status starts PENDING → admin/lecturer review → on approval the linked
 *     attendance flips to LATE_OUT (or PRESENT for "permission" type).
 *
 * Previously this form was pure mock — `onSubmit` only `console.log`-ed.
 * Now it pulls the student's classes from /users/{id}/enrollments and lets
 * them pick which class today's session the request belongs to.
 */
export default function RequirePermissionForm() {
  const user = useUser();
  const userId = user?.id ?? "";

  const { data: enrollments = [] } = useGetUserEnrollmentsQuery(userId, {
    skip: !userId,
  });

  // Today's clock at "now" used as default leaveTime.
  const defaultLeaveTime = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

  const [classroomId, setClassroomId] = useState<string>("");
  const [permissionType, setPermissionType] = useState<"late" | "permission">("permission");
  const [leaveTime, setLeaveTime] = useState<string>(defaultLeaveTime);
  const [reason, setReason] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) {
      toast.error("Please log in again.");
      return;
    }
    if (!classroomId) {
      toast.error("Pick the class this request is for.");
      return;
    }
    if (reason.trim().length < 5) {
      toast.error("Tell us a bit more — the reason should be at least 5 characters.");
      return;
    }

    setSaving(true);
    try {
      // Look up today's session for the chosen class. Same idempotent
      // "ensure-today" + read pair the take-attendance pages use, so a class
      // whose session hasn't been generated yet still works.
      const today = new Date().toISOString().slice(0, 10);
      await api.post(`/sessions/classrooms/${classroomId}/ensure-today`, {});
      const raw = await api.get(`/sessions/classrooms/${classroomId}?from=${today}&to=${today}&size=1`);
      const sessions = raw as { payload?: { content?: Array<{ id: number }> } | Array<{ id: number }> } | null;

      const payload = sessions?.payload;
      const sessionList: Array<{ id: number }> =
        payload && typeof payload === "object" && "content" in payload && Array.isArray(payload.content)
          ? payload.content
          : Array.isArray(payload) ? (payload as Array<{ id: number }>) : [];
      const sessionId = sessionList[0]?.id;
      if (!sessionId) {
        toast.error("No session is scheduled for that class today.");
        return;
      }

      await api.post(`/amendments/late-out`, {
        studentId: Number(userId),
        sessionId,
        leaveTime: leaveTime.length === 16 ? `${leaveTime}:00` : leaveTime,
        reason: `[${permissionType}] ${reason.trim()}`,
      });

      toast.success("Request submitted. You'll get a notification once an admin reviews it.");
      setReason("");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not submit the request."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid gap-5">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Request Permission</h1>
          <p className="text-sm text-muted-foreground">
            Submit a late-arrival or permission request. An admin will review and
            approve or reject — you&apos;ll see the decision in your notifications.
          </p>
        </div>

        <Field label="Class" required>
          <Select value={classroomId} onValueChange={setClassroomId}>
            <SelectTrigger>
              <SelectValue placeholder={enrollments.length === 0 ? "No enrolments yet" : "Pick a class"} />
            </SelectTrigger>
            <SelectContent>
              {enrollments.map((e) => {
                const id = String(e.classroomId ?? e.id ?? "");
                const label = e.className ?? e.classroomName ?? e.classCode ?? `Class ${id}`;
                return id ? (
                  <SelectItem key={id} value={id}>{label}</SelectItem>
                ) : null;
              })}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type" required>
            <Select value={permissionType} onValueChange={(v) => setPermissionType(v as "late" | "permission")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="late">Late arrival</SelectItem>
                <SelectItem value="permission">Permission / leaving early</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Time" required>
            <Input
              type="datetime-local"
              value={leaveTime}
              onChange={(e) => setLeaveTime(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground/70">
              Defaults to right now. Adjust if needed.
            </p>
          </Field>
        </div>

        <Field label="Reason" required>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell the admin why — e.g. doctor's appointment, traffic delay…"
            className="min-h-28"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => { setReason(""); setClassroomId(""); }}
            disabled={saving}
          >
            Reset
          </Button>
          <Button type="submit" className="w-full gap-1.5" disabled={saving}>
            {saving ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
            Submit Request
          </Button>
        </div>
      </div>
    </form>
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
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
