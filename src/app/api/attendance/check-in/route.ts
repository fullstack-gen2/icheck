import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, ATTENDANCE_API_URL } from "@/auth";
import { getDeviceId } from "@/lib/device-cookie";
import { getRequestUser } from "@/lib/server-user";

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
  const res = await fetch(
    `${ATTENDANCE_API_URL}/attendances/dynamic-qr-check-in`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        studentId: Number(user.id),
        qrToken:   body.qrToken,
        deviceId,
        latitude:  body.latitude  ?? null,
        longitude: body.longitude ?? null,
        ipAddress: body.ipAddress ?? null,
      }),
    }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
