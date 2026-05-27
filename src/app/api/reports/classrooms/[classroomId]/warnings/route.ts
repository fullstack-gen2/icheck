import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  const { classroomId } = await params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const res = await fetch(
    `${BASE_API_URL}/api/v1/attendance/reports/classrooms/${classroomId}/warnings?size=100`,
    { cache: "no-store", headers: { Cookie: cookieHeader } }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
