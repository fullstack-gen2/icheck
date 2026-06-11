import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, ATTENDANCE_API_URL } from "@/auth";
import { getDeviceId } from "@/lib/device-cookie";
import { getRequestUser } from "@/lib/server-user";
import { getClientIp } from "@/lib/client-ip";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const accessToken = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ACCESS_TOKEN_COOKIE}=`))
    ?.slice(ACCESS_TOKEN_COOKIE.length + 1);
  const user = await getRequestUser(cookieHeader);

  if (!accessToken || !user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deviceId = await getDeviceId();
  if (!deviceId) {
    return NextResponse.json(
      { success: false, message: "Missing device cookie. Please reload the page." },
      { status: 400 }
    );
  }

  const body = await req.json();
  // The frontend tells us whether this scan is for a static (classroom-printed)
  // QR or a dynamic (teacher-projected) one — they hit different backend
  // endpoints with different validation rules. Default to dynamic if omitted.
  const kind: "static" | "dynamic" = body.kind === "static" ? "static" : "dynamic";
  const endpoint =
    kind === "static" ? "/attendances/static-qr-check-in" : "/attendances/dynamic-qr-check-in";

  const payload: Record<string, unknown> = {
    studentId: Number(user.id),
    qrToken:   body.qrToken,
    deviceId,
    latitude:  body.latitude  ?? null,
    longitude: body.longitude ?? null,
    // IP validation (Rule 11, optional/admin-toggle): the client can't see
    // its own public IP, so the server reads it from proxy/request headers.
    ipAddress: body.ipAddress ?? getClientIp(req),
  };
  if (kind === "static") {
    // Static QR scan always requires a reason — backend rejects with 400
    // "A reason is required when checking in via static QR" if missing.
    payload.reason = body.reason ?? "";
  }

  const res = await fetch(`${ATTENDANCE_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
