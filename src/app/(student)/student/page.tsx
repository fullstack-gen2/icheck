"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { QrScanner } from "@/components/qr-scanner";
import { QrCodeIcon, ClipboardListIcon } from "lucide-react";

export default function StudentHomePage() {
  const { data: session } = useSession();
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {session?.user?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          Tap <strong>Check In</strong> and scan the QR code your teacher shows on screen.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Check In */}
        <button
          onClick={() => setShowScanner(true)}
          className="bg-[#273C97] text-white rounded-2xl p-6 text-left hover:bg-[#1e2e7a] active:scale-95 transition-all shadow-md"
        >
          <QrCodeIcon className="size-8 mb-3 opacity-90" />
          <h2 className="text-lg font-semibold mb-1">Check In</h2>
          <p className="text-sm text-white/70">
            Scan the QR code shown in class to record your attendance.
          </p>
        </button>

        {/* My Attendance */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <ClipboardListIcon className="size-8 mb-3 text-[#273C97] opacity-80" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            My Attendance
          </h2>
          <p className="text-sm text-gray-500">
            View your attendance history and status.
          </p>
        </div>
      </div>

      {showScanner && (
        <QrScanner onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
