import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const res = await fetch(
    `${BASE_API_URL}/reports/students/${studentId}?size=50`,
    { cache: "no-store", headers: { Cookie: cookieHeader } }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
