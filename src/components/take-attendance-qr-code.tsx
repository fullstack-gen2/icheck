"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const QR_DURATION_SECONDS = 1 * 10;
const QR_LOGO_URL =
  "https://res.cloudinary.com/dsmqsivcj/image/upload/v1780286128/c4lgj7uipplt47mergga.png";

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = seconds % 60;

  return `${minutes}:${secondsLeft.toString().padStart(2, "0")}`;
}

type TakeAttendanceQrCodeProps = {
  closeHref?: string;
  qrUrl?: string;
  qrSize?: string;
  logoSize?: number;
};

export function TakeAttendanceQrCode({
  closeHref,
  qrUrl = "https://yourapp.com/checkin?token=abc123",
  qrSize = "min(86vmin, calc(100vw - 4rem), calc(100vh - 8rem))",
  logoSize = 220,
}: TakeAttendanceQrCodeProps) {
  const router = useRouter();
  const didCloseRef = useRef(false);
  const [remaining, setRemaining] = useState(QR_DURATION_SECONDS);
  const isExpired = remaining === 0;
  const isUrgent = remaining <= 60;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isExpired || didCloseRef.current) return;

    didCloseRef.current = true;
    const closeTimer = window.setTimeout(() => {
      if (closeHref) {
        router.replace(closeHref);
        return;
      }

      router.back();
    }, 500);

    return () => window.clearTimeout(closeTimer);
  }, [closeHref, isExpired, router]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-5">
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
          QR expires in
        </p>
        <p className="font-mono text-5xl font-semibold leading-tight tabular-nums">
          {formatRemaining(remaining)}
        </p>
      </div>

      <div className="aspect-square" style={{ width: qrSize, height: qrSize }}>
        <QRCodeCanvas
          value={qrUrl}
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
      </div>
    </div>
  );
}
