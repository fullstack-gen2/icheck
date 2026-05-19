"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { XIcon, CameraIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";

interface Props {
  onClose: () => void;
  deviceId: string;
}

type ScanState = "scanning" | "submitting" | "success" | "error";

export function QrScanner({ onClose, deviceId }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      async (decodedText) => {
        if (scanState !== "scanning") return;
        await scanner.stop().catch(() => {});
        await handleCheckIn(decodedText);
      },
      () => {}
    ).catch(() => {
      setScanState("error");
      setMessage("Camera access denied. Please allow camera permission.");
    });

    return () => {
      scanner.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckIn = async (qrToken: string) => {
    setScanState("submitting");
    try {
      // Get geolocation if available
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
        body: JSON.stringify({ qrToken, deviceId, latitude, longitude }),
      });
      const json = await res.json();

      if (res.ok) {
        setScanState("success");
        setMessage("Attendance recorded successfully!");
      } else {
        setScanState("error");
        setMessage(
          json?.payload?.message ?? json?.message ?? "Check-in failed. Try again."
        );
      }
    } catch {
      setScanState("error");
      setMessage("Network error. Check your connection.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <CameraIcon className="size-5 text-[#273C97]" />
            <span className="font-semibold">Scan QR Code</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Scanner / Result */}
        <div className="p-5">
          {scanState === "scanning" && (
            <>
              <p className="text-sm text-gray-500 text-center mb-4">
                Point your camera at the QR code on screen
              </p>
              <div
                id="qr-reader"
                className="rounded-2xl overflow-hidden border-2 border-dashed border-[#273C97]/30"
              />
            </>
          )}

          {scanState === "submitting" && (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="size-12 border-4 border-[#273C97] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Recording attendance…</p>
            </div>
          )}

          {scanState === "success" && (
            <div className="py-10 flex flex-col items-center gap-3 text-center">
              <CheckCircleIcon className="size-14 text-green-500" />
              <p className="font-semibold text-gray-900">Check-in Successful!</p>
              <p className="text-sm text-gray-500">{message}</p>
              <Button className="mt-2 w-full bg-[#273C97]" onClick={onClose}>
                Done
              </Button>
            </div>
          )}

          {scanState === "error" && (
            <div className="py-10 flex flex-col items-center gap-3 text-center">
              <AlertCircleIcon className="size-14 text-red-400" />
              <p className="font-semibold text-gray-900">Check-in Failed</p>
              <p className="text-sm text-gray-500">{message}</p>
              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => {
                  setScanState("scanning");
                  setMessage("");
                  // Restart scanner
                  const scanner = new Html5Qrcode("qr-reader");
                  scannerRef.current = scanner;
                  scanner.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 240, height: 240 } },
                    async (text) => {
                      await scanner.stop().catch(() => {});
                      await handleCheckIn(text);
                    },
                    () => {}
                  ).catch(() => {});
                }}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
