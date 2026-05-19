"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircleIcon, AlertCircleIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "loading" | "success" | "error" | "noToken";

function getOrCreateDeviceId(): string {
  const key = "i-check-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function CheckInPage() {
  return (
    <Suspense>
      <CheckInContent />
    </Suspense>
  );
}

function CheckInContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { data: session, status } = useSession();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setState("noToken"); return; }
    if (status === "loading") return;
    if (status === "unauthenticated") return; // middleware will redirect to login

    doCheckIn();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token]);

  const doCheckIn = async () => {
    setState("loading");
    try {
      let latitude: number | null = null;
      let longitude: number | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {}

      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrToken: token,
          deviceId: getOrCreateDeviceId(),
          latitude,
          longitude,
        }),
      });
      const json = await res.json();

      if (res.ok) {
        setState("success");
        setMessage(`Attendance recorded for ${session?.user?.name ?? "you"}.`);
      } else {
        setState("error");
        setMessage(
          json?.payload?.message ?? json?.message ?? "Check-in failed. The QR may have expired."
        );
      }
    } catch {
      setState("error");
      setMessage("Network error. Make sure you are connected.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#273C97] text-white font-bold text-sm">
            iC
          </div>
          <span className="text-xl font-bold tracking-tight">i-Check</span>
        </div>

        {state === "loading" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <LoaderCircleIcon className="size-12 text-[#273C97] animate-spin" />
            <p className="text-gray-600 font-medium">Recording attendance…</p>
          </div>
        )}

        {state === "success" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircleIcon className="size-16 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900">Check-in Successful!</h2>
            <p className="text-gray-500 text-sm">{message}</p>
            <Button
              className="mt-2 w-full bg-[#273C97] hover:bg-[#1e2e7a]"
              onClick={() => window.location.href = "/student"}
            >
              Go to My Attendance
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <AlertCircleIcon className="size-16 text-red-400" />
            <h2 className="text-xl font-bold text-gray-900">Check-in Failed</h2>
            <p className="text-gray-500 text-sm">{message}</p>
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={doCheckIn}
            >
              Try Again
            </Button>
            <Button
              variant="ghost"
              className="w-full text-gray-400"
              onClick={() => window.location.href = "/student"}
            >
              Back to Home
            </Button>
          </div>
        )}

        {state === "noToken" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <AlertCircleIcon className="size-16 text-yellow-400" />
            <h2 className="text-xl font-bold text-gray-900">Invalid QR Code</h2>
            <p className="text-gray-500 text-sm">This QR code is not valid. Ask your teacher to show a new one.</p>
            <Button
              className="mt-2 w-full bg-[#273C97]"
              onClick={() => window.location.href = "/student"}
            >
              Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
