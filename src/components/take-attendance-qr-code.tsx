"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { AlertCircleIcon, LoaderCircleIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useEnsureTodaySessionsForClassroomMutation,
  useGetTodaySessionsForClassroomQuery,
  useOpenSessionMutation,
  useGenerateDynamicQrMutation,
  type SessionDto,
} from "@/store/api/qrApi";

const QR_LOGO_URL =
  "https://res.cloudinary.com/dsmqsivcj/image/upload/v1780286128/c4lgj7uipplt47mergga.png";
const FALLBACK_QR_SECONDS = 30;

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = seconds % 60;
  return `${minutes}:${secondsLeft.toString().padStart(2, "0")}`;
}

interface ApiErrorShape {
  data?: { payload?: { message?: string }; message?: string };
  status?: number | string;
}

function extractMessage(err: unknown, fallback: string): string {
  const e = err as ApiErrorShape;
  return e?.data?.payload?.message ?? e?.data?.message ?? fallback;
}

type TakeAttendanceQrCodeProps = {
  /** Classroom this QR belongs to — used to find today's session. */
  classroomId: number;
  closeHref?: string;
  qrSize?: string;
  logoSize?: number;
};

export function TakeAttendanceQrCode({
  classroomId,
  closeHref,
  qrSize = "min(86vmin, calc(100vw - 4rem), calc(100vh - 8rem))",
  logoSize = 220,
}: TakeAttendanceQrCodeProps) {
  const router = useRouter();

  // Make sure today's session row exists (the 06:00 generator may have missed
  // schedules created after it ran). Idempotent — runs once on mount and
  // invalidates Session tags so the query below refetches with the new row.
  const [ensureToday, { isLoading: ensuringToday }] =
    useEnsureTodaySessionsForClassroomMutation();
  const ensuredRef = useRef(false);
  useEffect(() => {
    if (ensuredRef.current) return;
    ensuredRef.current = true;
    void ensureToday(classroomId);
  }, [ensureToday, classroomId]);

  const {
    data: sessions,
    isFetching: loadingSessions,
    isError: sessionsErrored,
  } = useGetTodaySessionsForClassroomQuery({ classroomId });
  const [openSession] = useOpenSessionMutation();
  const [generateDynamicQr] = useGenerateDynamicQrMutation();

  const [session, setSession] = useState<SessionDto | null>(null);
  const [qr, setQr] = useState<{ codeValue: string; expireTime: string | null } | null>(null);
  const [remaining, setRemaining] = useState(FALLBACK_QR_SECONDS);
  const [duration, setDuration] = useState(FALLBACK_QR_SECONDS);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const initRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isExpired = remaining <= 0;
  const isUrgent = remaining <= Math.min(8, Math.ceil(duration / 3));

  const generate = useCallback(
    async (sessionId: number) => {
      setLoading(true);
      try {
        const result = await generateDynamicQr(sessionId).unwrap();
        setQr({ codeValue: result.codeValue, expireTime: result.expireTime });
        setError("");
        const secs = result.expireTime
          ? Math.max(1, Math.round((new Date(result.expireTime).getTime() - Date.now()) / 1000))
          : FALLBACK_QR_SECONDS;
        setRemaining(secs);
        setDuration(secs);
      } catch (e) {
        setError(extractMessage(e, "Failed to generate QR code. Make sure the session is active."));
      } finally {
        setLoading(false);
      }
    },
    [generateDynamicQr]
  );

  // Find (and open, if needed) today's session for this classroom, then generate the first QR.
  useEffect(() => {
    if (initRef.current) return;
    // Wait for the on-demand session generator to finish — otherwise the first
    // pass through this effect can see an empty list and short-circuit before
    // the row materialises.
    if (ensuringToday) return;
    if (!sessions) return;
    initRef.current = true;

    (async () => {
      const target =
        sessions.find((s) => s.status === "ACTIVE") ??
        sessions.find((s) => s.status === "UPCOMING");

      if (!target) {
        setError("No session is scheduled for this class today.");
        return;
      }

      setSession(target);

      if (target.status === "UPCOMING") {
        try {
          await openSession(target.id).unwrap();
        } catch (e) {
          setError(extractMessage(e, "Could not start the session yet — check the session schedule."));
          return;
        }
      }

      await generate(target.id);
    })();
  }, [sessions, ensuringToday, openSession, generate]);

  // Countdown ticker — auto-rotates the QR when it expires.
  useEffect(() => {
    if (!session || !qr) return;
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          generate(session.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session, qr, generate]);

  const checkInUrl =
    qr && typeof window !== "undefined"
      ? `${window.location.origin}/check-in?token=${qr.codeValue}`
      : "";

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-5">
      {session && (
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">{session.subjectName}</p>
          <p className="text-xs text-muted-foreground/70">
            {session.classroomName} &nbsp;·&nbsp; {session.startTime?.slice(0, 5)}–
            {session.endTime?.slice(0, 5)}
          </p>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircleIcon className="size-12 text-red-400" />
          <p className="max-w-xs text-sm text-muted-foreground">{error}</p>
          {session && (
            <Button onClick={() => generate(session.id)} disabled={loading} className="gap-2">
              {loading ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="size-4" />
              )}
              Retry
            </Button>
          )}
        </div>
      ) : (
        <>
          <div
            className={`rounded-2xl px-8 pt-3 text-center shadow-sm ${
              isExpired
                ? "bg-red-50 text-red-600 dark:bg-red-950/40"
                : isUrgent
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-background/90 text-foreground"
            }`}
          >
            <p className="text-sm font-medium uppercase tracking-wide opacity-70">
              QR refreshes in
            </p>
            <p className="font-mono text-5xl font-semibold leading-tight tabular-nums">
              {formatRemaining(remaining)}
            </p>
          </div>

          <div className="aspect-square" style={{ width: qrSize, height: qrSize }}>
            {qr ? (
              <QRCodeCanvas
                value={checkInUrl}
                size={1024}
                className="block size-full"
                style={{ width: "100%", height: "100%" }}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: QR_LOGO_URL,
                  x: undefined,
                  y: undefined,
                  height: logoSize,
                  width: logoSize,
                  excavate: true,
                }}
              />
            ) : (
              <div className="flex size-full items-center justify-center rounded-xl bg-muted">
                <LoaderCircleIcon className="size-10 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground/70">
            {ensuringToday
              ? "Preparing today's session…"
              : loadingSessions
                ? "Loading session…"
                : sessionsErrored
                  ? "Could not load today's sessions."
                  : "Students scan this QR with i-Check to mark attendance"}
          </p>
        </>
      )}

      {closeHref && (
        <Button
          variant="outline"
          className="mt-2 w-full max-w-xs"
          onClick={() => router.replace(closeHref)}
        >
          Done
        </Button>
      )}
    </div>
  );
}
