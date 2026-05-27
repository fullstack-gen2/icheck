import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/auth";
import { getRequestUser } from "@/lib/server-user";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieHeader = request.headers.get("cookie") ?? "";

  const user = await getRequestUser(cookieHeader);
  const adminId = user?.id ?? "";

  const res = await fetch(
    `${BASE_API_URL}/attendance/reports/${id}/lock?adminId=${adminId}`,
    { method: "POST", headers: { Cookie: cookieHeader } }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
