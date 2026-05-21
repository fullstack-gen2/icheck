import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getDeviceId } from "@/lib/device-cookie";

const BASE_API_URL = process.env.BASE_API_URL ?? "http://localhost:8090";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Device id is taken from the HttpOnly cookie, never the request body —
  // a malicious client can't pretend to be on another device.
  const deviceId = await getDeviceId();
  if (!deviceId) {
    return NextResponse.json(
      { success: false, message: "Missing device cookie. Please reload the page." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const res = await fetch(`${BASE_API_URL}/api/v1/attendances/dynamic-qr-check-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: Number(session.user.userId),
      qrToken:   body.qrToken,
      deviceId,                                // ← from cookie
      latitude:  body.latitude  ?? null,
      longitude: body.longitude ?? null,
      ipAddress: body.ipAddress ?? null,
    }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
