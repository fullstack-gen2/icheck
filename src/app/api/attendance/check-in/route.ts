import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/api/attendances/dynamic-qr-check-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: Number(session.user.userId),
      qrToken: body.qrToken,
      deviceId: body.deviceId,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      ipAddress: body.ipAddress ?? null,
    }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
