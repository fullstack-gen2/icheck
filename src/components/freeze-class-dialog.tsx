"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SnowflakeIcon, FlameIcon, LoaderCircleIcon } from "lucide-react";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error-utils";
import {
  useGetSettingsQuery,
  useUpdateSettingMutation,
} from "@/store/api/attendanceApi";

const GLOBAL_FREEZE_KEY = "attendance_frozen";

interface Props {
  /** Per-class freeze when set. Omit for the global (whole-school) toggle. */
  classroomId?: number;
  className?: string;
  /** Current frozen state of this class (for the per-class toggle label). */
  frozen?: boolean;
}

/**
 * Freeze toggle.
 * - Per-class (classroomId set): PATCH /classrooms/{id}/freeze?frozen=… — pauses
 *   one class. Frozen classes generate no sessions and reject check-ins.
 * - Global (no classroomId): toggles the `attendance_frozen` system setting —
 *   pauses every class school-wide.
 *
 * Replaces the old date-based dialog with a persistent on/off switch, matching
 * "global setting for freeze-all, per-class flag for each class".
 */
export function FreezeClassDialog({ classroomId, className, frozen }: Props) {
  const router = useRouter();
  const isGlobal = classroomId == null;

  // Global mode reads the live setting so the button reflects current state.
  const { data: settings = [] } = useGetSettingsQuery(undefined, { skip: !isGlobal });
  const [updateSetting] = useUpdateSettingMutation();
  const globalFrozen =
    settings.find((s) => s.settingKey === GLOBAL_FREEZE_KEY)?.settingValue === "true";

  const currentlyFrozen = isGlobal ? globalFrozen : !!frozen;
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const next = !currentlyFrozen;
      if (isGlobal) {
        await updateSetting({ key: GLOBAL_FREEZE_KEY, value: String(next) }).unwrap();
        toast.success(next ? "Whole school frozen." : "School unfrozen.");
      } else {
        await api.patch(`/classrooms/${classroomId}/freeze?frozen=${next}`, undefined);
        toast.success(next ? `${className ?? "Class"} frozen.` : `${className ?? "Class"} unfrozen.`);
      }
      router.refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not change freeze state."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant={currentlyFrozen ? "default" : "outline"}
      className={`p-5 gap-1.5 ${currentlyFrozen ? "bg-sky-600 hover:bg-sky-700 text-white" : ""}`}
      onClick={toggle}
      disabled={busy}
      title={
        isGlobal
          ? "Freeze / unfreeze attendance for the whole school"
          : "Freeze / unfreeze this class"
      }
    >
      {busy
        ? <LoaderCircleIcon className="size-4 animate-spin" />
        : currentlyFrozen
          ? <FlameIcon className="size-4" />
          : <SnowflakeIcon className="size-4" />}
      {currentlyFrozen
        ? (isGlobal ? "Unfreeze All" : "Unfreeze")
        : (isGlobal ? "Freeze All" : "Freeze")}
    </Button>
  );
}
