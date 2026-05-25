import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BASE_API_URL = process.env.BASE_API_URL ?? "http://localhost:8090";

// Force per-request execution — without this, Next.js may cache the first
// response (e.g. a pre-login 401) and keep serving it indefinitely.
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classroomId } = await params;
  const res = await fetch(
    `${BASE_API_URL}/api/v1/reports/classrooms/${classroomId}/warnings?size=100`,
    { cache: "no-store" }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
