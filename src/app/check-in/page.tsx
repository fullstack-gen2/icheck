"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/user-provider";
import { CheckCircleIcon, AlertCircleIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

type State = "loading" | "success" | "error" | "noToken";

const FETCH_TIMEOUT_MS = 12_000;

/** Get GPS coords with a 2s timeout — never throws, returns null on fail/timeout */
async function getCoords(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 2000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timer); resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); },
      () => { clearTimeout(timer); resolve(null); },
      { timeout: 1500, maximumAge: 60000 }
    );
  });
}

export default function CheckInPage() {
  return (
    <Suspense>
      <CheckInContent />
    </Suspense>
  );
}

function CheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const user = useUser();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");
  const didSubmit = useRef(false);

  const doCheckIn = async (qrToken: string) => {
    if (didSubmit.current) return;
    didSubmit.current = true;
    setState("loading");

    // GPS: fire in parallel, don't block — 2s max
    const coordsPromise = getCoords();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const coords = await coordsPromise; // at most 2s wait

      // The proxy reads the HttpOnly device cookie server-side, so we never
      // expose or send the device id from client JS.
      const res = await fetch("/attendance/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          qrToken,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        }),
      });
      clearTimeout(timeout);

      const json = await res.json();

      if (res.ok) {
        setState("success");
        setMessage(`Attendance recorded for ${user?.name ?? "you"}.`);
      } else {
        setState("error");
        setMessage(
          json?.payload?.message ??
          json?.message ??
          "Check-in failed. The QR may have expired — ask your teacher to refresh it."
        );
      }
    } catch (err: unknown) {
      clearTimeout(timeout);
      didSubmit.current = false; // allow retry
      const isAbort = err instanceof Error && err.name === "AbortError";
      setState("error");
      setMessage(
        isAbort
          ? "Request timed out. Check your connection and try again."
          : "Network error. Make sure you are connected."
      );
    }
  };

  useEffect(() => {
    if (!token) { setState("noToken"); return; }
    doCheckIn(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-6">
      <div className="bg-card rounded-3xl shadow-lg p-8 w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Logo size={36} />
          <span className="text-xl font-bold tracking-tight">i-Check</span>
        </div>

        {state === "loading" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <LoaderCircleIcon className="size-12 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Recording attendance…</p>
            <p className="text-xs text-muted-foreground/70">This may take a few seconds</p>
          </div>
        )}

        {state === "success" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircleIcon className="size-16 text-green-500" />
            <h2 className="text-xl font-bold text-foreground">Check-in Successful!</h2>
            <p className="text-muted-foreground text-sm">{message}</p>
            <Button
              className="mt-2 w-full bg-primary hover:bg-primary/90"
              onClick={() => router.push("/student")}
            >
              Go to My Attendance
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <AlertCircleIcon className="size-16 text-red-400" />
            <h2 className="text-xl font-bold text-foreground">Check-in Failed</h2>
            <p className="text-muted-foreground text-sm">{message}</p>
            <Button
              className="mt-2 w-full bg-primary hover:bg-primary/90"
              onClick={() => { didSubmit.current = false; token && doCheckIn(token); }}
            >
              Try Again
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground/70"
              onClick={() => router.push("/student")}
            >
              Back to Home
            </Button>
          </div>
        )}

        {state === "noToken" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <AlertCircleIcon className="size-16 text-yellow-400" />
            <h2 className="text-xl font-bold text-foreground">Invalid QR Code</h2>
            <p className="text-muted-foreground text-sm">This QR code is not valid. Ask your teacher to show a new one.</p>
            <Button
              className="mt-2 w-full bg-primary"
              onClick={() => router.push("/student")}
            >
              Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
