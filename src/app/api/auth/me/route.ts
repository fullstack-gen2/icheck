import { ACCESS_TOKEN_COOKIE, AUTH_API_URL } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getCookie(req: Request, name: string) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function GET(req: Request) {
  const accessToken = getCookie(req, ACCESS_TOKEN_COOKIE);

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const res = await fetch(`${AUTH_API_URL}/me`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
