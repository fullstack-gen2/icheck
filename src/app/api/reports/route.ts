import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const body = await request.json();
  const { type, ...payload } = body;

  const res = await fetch(
    `${BASE_API_URL}/api/v1/attendance/reports/${type}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
