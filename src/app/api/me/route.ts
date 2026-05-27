import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const res = await fetch(`${BASE_API_URL}/users/me`, {
    cache: "no-store",
    headers: { Cookie: cookieHeader },
  }).catch(() => null);

  if (!res?.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
