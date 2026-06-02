"use client";

import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";

export default function MyQR() {
  const qrUrl = "https://yourapp.com/checkin?token=abc123";
  return (
    <>
      <div>
        <Link href={"/dashboard"}>
          <button className="px-2 py-1 rounded-2xl">Back Dashboard</button>
        </Link>
      </div>
      <div className="flex flex-col justify-center items-center h-screen">
        <QRCodeCanvas
          value={qrUrl}
          size={1100}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: "https://res.cloudinary.com/dsmqsivcj/image/upload/v1780286128/c4lgj7uipplt47mergga.png",
            x: undefined,
            y: undefined,
            height: 300,
            width: 300,
            excavate: true,
          }}
        />
      </div>
    </>
  );
}
