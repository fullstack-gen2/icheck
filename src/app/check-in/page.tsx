"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/user-provider";
import { CheckCircleIcon, AlertCircleIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";

type State = "loading" | "success" | "error" | "noToken" | "needReason";

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
  // Static (classroom-printed) QR redirects with ?kind=static. A static scan is
  // a fast scan like the dynamic QR: on time it records immediately with no
  // reason. Only if the backend rejects it as a LATE scan ("reason is required")
  // do we prompt the student for a reason.
  const kindParam = searchParams.get("kind");
  const isStatic = kindParam === "static";
  const user = useUser();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const didSubmit = useRef(false);
  const viewState: State = token ? state : "noToken";

  const doCheckIn = async (qrToken: string, reasonOverride?: string) => {
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
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          qrToken,
          kind: isStatic ? "static" : "dynamic",
          reason: reasonOverride ?? (isStatic ? reason : undefined),
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        }),
      });
      clearTimeout(timeout);

      const json = await res.json();

      if (res.ok) {
        const usedReason = Boolean((reasonOverride ?? reason)?.trim());
        setState("success");
        setMessage(
          usedReason
            ? "Late check-in recorded — your reason was submitted for review."
            : `Attendance recorded for ${user?.name ?? "you"}.`
        );
      } else {
        // Surface the REAL reason — read every field the backend / proxy might
        // use (payload.message, message, error). Only fall back to the generic
        // hint when the response truly carries nothing.
        const errMsg: string =
          json?.payload?.message ??
          json?.message ??
          json?.error ??
          "Check-in failed. Please try again, or ask your teacher to re-open the QR.";

        // Backend signal that a reason is required (static QR, missing reason).
        if (/reason is required/i.test(errMsg)) {
          setState("needReason");
          setMessage("This is a static (classroom) QR — please give a short reason for your late scan.");
          didSubmit.current = false;
          return;
        }
        setState("error");
        setMessage(errMsg);
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

  // Both static and dynamic scans auto-attempt the check-in on load. A static
  // on-time scan succeeds immediately (no reason); a static LATE scan comes back
  // with "reason is required", which flips us to the needReason form below.
  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => {
      doCheckIn(token);
    }, 0);
    return () => window.clearTimeout(timer);
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

        {viewState === "loading" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <LoaderCircleIcon className="size-12 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Recording attendance…</p>
            <p className="text-xs text-muted-foreground/70">This may take a few seconds</p>
          </div>
        )}

        {viewState === "success" && (
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

        {viewState === "needReason" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <AlertCircleIcon className="size-12 text-amber-500" />
            <h2 className="text-xl font-bold text-foreground">Reason required</h2>
            <p className="text-muted-foreground text-sm">{message}</p>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Traffic delay, ran late from lab…"
              className="w-full"
              autoFocus
            />
            <Button
              className="mt-2 w-full bg-primary hover:bg-primary/90"
              disabled={reason.trim().length < 3}
              onClick={() => {
                if (!token) return;
                didSubmit.current = false;
                doCheckIn(token, reason.trim());
              }}
            >
              Submit reason &amp; check in
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground/70"
              onClick={() => router.push("/student")}
            >
              Cancel
            </Button>
          </div>
        )}

        {viewState === "error" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <AlertCircleIcon className="size-16 text-red-400" />
            <h2 className="text-xl font-bold text-foreground">Check-in Failed</h2>
            <p className="text-muted-foreground text-sm">{message}</p>
            <Button
              className="mt-2 w-full bg-primary hover:bg-primary/90"
              onClick={() => {
                if (!token) return;
                didSubmit.current = false;
                doCheckIn(token);
              }}
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

        {viewState === "noToken" && (
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
