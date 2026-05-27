import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const res = await fetch(
    `${BASE_API_URL}/attendance/users/students/${id}/device`,
    { method: "DELETE", headers: { Cookie: cookieHeader } }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
