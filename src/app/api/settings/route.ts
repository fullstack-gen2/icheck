import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BASE_API_URL = process.env.BASE_API_URL ?? "http://localhost:8090";

/**
 * Proxy a request to the Spring backend and forward whatever it says back to
 * the browser — including non-2xx responses and non-JSON bodies. Without this
 * the route just rethrows on `res.json()` and the browser sees a generic 500
 * with no detail.
 */
async function proxy(url: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init });
  } catch (err) {
    console.error("[settings proxy] fetch failed:", url, err);
    return NextResponse.json(
      { success: false, message: `Cannot reach backend at ${url}` },
      { status: 502 }
    );
  }

  const text = await res.text();
  // Try to parse as JSON; if upstream returned HTML/text, surface as message.
  try {
    return NextResponse.json(text ? JSON.parse(text) : {}, { status: res.status });
  } catch {
    console.error("[settings proxy] non-JSON upstream:", res.status, text.slice(0, 300));
    return NextResponse.json(
      { success: false, message: `Upstream returned non-JSON (${res.status})`, raw: text.slice(0, 500) },
      { status: res.status >= 400 ? res.status : 502 }
    );
  }
}

export async function GET(request: Request) {
  const session = await auth();

  // Diagnostic: log cookies the browser actually sent on THIS request.
  // If the session cookie name is missing here, the browser scoped it to a
  // path that doesn't include /attendance/api/settings.
  if (!session) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const cookieNames = cookieHeader.split(";").map((c) => c.trim().split("=")[0]).filter(Boolean);
    console.warn("[settings proxy] no session. Cookies seen on request:", cookieNames);
    return NextResponse.json(
      { error: "Unauthorized", debug: { cookieNames } },
      { status: 401 }
    );
  }
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return proxy(`${BASE_API_URL}/api/v1/settings`, {
    headers: { Authorization: `Bearer ${session.user.backendToken}` },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  return proxy(`${BASE_API_URL}/api/v1/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.user.backendToken}`,
    },
    body: JSON.stringify(body),
  });
}
