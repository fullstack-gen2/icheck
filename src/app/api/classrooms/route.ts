import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = searchParams.get("size") ?? "100";
  const page = searchParams.get("page") ?? "0";

  const cookieHeader = request.headers.get("cookie") ?? "";
  const res = await fetch(
    `${BASE_API_URL}/classrooms?page=${page}&size=${size}`,
    { cache: "no-store", headers: { Cookie: cookieHeader } }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
