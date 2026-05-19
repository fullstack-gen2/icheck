"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SmartphoneIcon, LoaderCircleIcon, CheckIcon } from "lucide-react";

export function ResetDeviceButton({ studentId }: { studentId: number }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  const handleReset = async () => {
    if (state === "loading") return;
    setState("loading");

    const res = await fetch(`/api/students/${studentId}/device`, {
      method: "DELETE",
    });

    setState(res.ok ? "done" : "error");
    if (res.ok) setTimeout(() => setState("idle"), 3000);
  };

  return (
    <Button
      size="sm"
      variant={state === "error" ? "destructive" : "outline"}
      className="gap-1.5 text-xs"
      onClick={handleReset}
      disabled={state === "loading" || state === "done"}
    >
      {state === "loading" && (
        <LoaderCircleIcon className="size-3 animate-spin" />
      )}
      {state === "done" && <CheckIcon className="size-3 text-green-600" />}
      {(state === "idle" || state === "error") && (
        <SmartphoneIcon className="size-3" />
      )}
      {state === "idle" && "Reset Device"}
      {state === "loading" && "Resetting…"}
      {state === "done" && "Device Cleared"}
      {state === "error" && "Failed"}
    </Button>
  );
}
