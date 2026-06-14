"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
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
import { QrCodeIcon, DownloadIcon, LoaderCircleIcon } from "lucide-react";
import { useGetClassroomStaticQrMutation } from "@/store/api/qrApi";

interface Props {
  classroomId: number;
  className: string;
}

/** Filesystem-safe version of the class name for the download file. */
function safeFileName(name: string): string {
  return (name || "class")
    .trim()
    .replace(/[^\w\-]+/g, "_")   // non-word → underscore
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    || "class";
}

/**
 * Admin "Static QR" — shows the classroom's permanent QR and lets you download
 * it as a PNG named after the class (e.g. "ITP_Evening.png"). The static QR is
 * idempotent on the backend: the same code is returned every time, so this is
 * safe to open repeatedly. Print it / stick it on the wall — students scan it
 * to check in (reason required; same GPS/device/IP/late rules as dynamic QR).
 */
export function StaticQrDialog({ classroomId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [codeValue, setCodeValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [getStaticQr] = useGetClassroomStaticQrMutation();
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);

  // Fetch (idempotently create) the static QR when the dialog opens.
  useEffect(() => {
    if (!open || codeValue) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qr = await getStaticQr(classroomId).unwrap();
        if (!cancelled) setCodeValue(qr.codeValue);
      } catch {
        if (!cancelled) toast.error("Could not load the static QR for this class.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, codeValue, classroomId, getStaticQr]);

  const checkInUrl =
    codeValue && typeof window !== "undefined"
      ? `${window.location.origin}/check-in?token=${codeValue}&kind=static`
      : "";

  function handleDownload() {
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    if (!canvas) {
      toast.error("QR not ready yet.");
      return;
    }
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFileName(className)}-static-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="p-5 gap-1.5">
          <QrCodeIcon className="size-4" /> Static QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCodeIcon className="size-5 text-primary" />
            Static QR — {className}
          </DialogTitle>
          <DialogDescription>
            Permanent classroom QR. Print or display it; students scan it to
            check in. Same rules as the dynamic QR (GPS, device, late window) —
            a reason is required on static scans.
          </DialogDescription>
        </DialogHeader>

        <div ref={canvasWrapRef} className="flex flex-col items-center gap-3 py-3">
          {loading || !checkInUrl ? (
            <div className="flex h-[240px] items-center justify-center">
              <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-xl border bg-white p-4">
              <QRCodeCanvas value={checkInUrl} size={220} level="H" includeMargin />
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={loading || !checkInUrl} className="gap-1.5">
            <DownloadIcon className="size-4" /> Download PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
