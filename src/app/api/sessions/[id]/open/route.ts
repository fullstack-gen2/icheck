import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BASE_API_URL = process.env.BASE_API_URL ?? "http://localhost:8090";

// Force per-request execution — without this, Next.js may cache the first
// response (e.g. a pre-login 401) and keep serving it indefinitely.
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const res = await fetch(`${BASE_API_URL}/api/v1/sessions/${id}/open`, {
    method: "POST",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
