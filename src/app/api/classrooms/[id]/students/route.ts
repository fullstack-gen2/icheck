import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BASE_API_URL = process.env.BASE_API_URL ?? "http://localhost:8090";

// Force per-request execution — without this, Next.js may cache the first
// response (e.g. a pre-login 401) and keep serving it indefinitely.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const res = await fetch(
    `${BASE_API_URL}/api/v1/classrooms/${id}/students?size=200`,
    { cache: "no-store" }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
