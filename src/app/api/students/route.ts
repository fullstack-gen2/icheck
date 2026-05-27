import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "0";
  const size = searchParams.get("size") ?? "20";

  const cookieHeader = request.headers.get("cookie") ?? "";
  const res = await fetch(
    `${BASE_API_URL}/users/students?page=${page}&size=${size}`,
    { cache: "no-store", headers: { Cookie: cookieHeader } }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
