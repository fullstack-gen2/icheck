import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BASE_API_URL = process.env.BASE_API_URL ?? "http://localhost:8090";

// Force per-request execution — without this, Next.js may cache the first
// response (e.g. a pre-login 401) and keep serving it indefinitely.
export const dynamic = "force-dynamic";

/**
 * Proxy that forwards the upstream status and surfaces the real body — JSON
 * if parseable, otherwise the first 500 chars as a `raw` field so we can see
 * Spring stack traces / ngrok error pages in the browser response.
 */
async function proxy(url: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init });
  } catch (err) {
    console.error("[settings/[key] proxy] fetch failed:", url, err);
    return NextResponse.json(
      { success: false, message: `Cannot reach backend at ${url}` },
      { status: 502 }
    );
  }

  const text = await res.text();
  try {
    return NextResponse.json(text ? JSON.parse(text) : {}, { status: res.status });
  } catch {
    console.error("[settings/[key] proxy] non-JSON upstream:", res.status, text.slice(0, 300));
    return NextResponse.json(
      { success: false, message: `Upstream returned non-JSON (${res.status})`, raw: text.slice(0, 500) },
      { status: res.status >= 400 ? res.status : 502 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;
  const body = await request.json();

  // No Authorization header — see GET handler in ../route.ts for why.
  return proxy(`${BASE_API_URL}/api/v1/settings/${key}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;

  return proxy(`${BASE_API_URL}/api/v1/settings/${key}`, { method: "DELETE" });
}
