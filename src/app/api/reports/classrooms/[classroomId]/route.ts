import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classroomId } = await params;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "0";
  const size = searchParams.get("size") ?? "100";

  const res = await fetch(
    `${BACKEND_URL}/api/reports/classrooms/${classroomId}?page=${page}&size=${size}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
