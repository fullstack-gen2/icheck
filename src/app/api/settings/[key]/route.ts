import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/auth";

export const dynamic = "force-dynamic";

async function proxy(url: string, cookieHeader: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: { Cookie: cookieHeader, ...(init?.headers as Record<string, string> | undefined) },
    });
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
  const { key } = await params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const body = await request.json();
  return proxy(`${BASE_API_URL}/api/v1/attendance/settings/${key}`, cookieHeader, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  return proxy(`${BASE_API_URL}/api/v1/attendance/settings/${key}`, cookieHeader, { method: "DELETE" });
}
