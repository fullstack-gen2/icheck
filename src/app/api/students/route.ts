import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BASE_API_URL = process.env.BASE_API_URL ?? "http://localhost:8090";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.role === "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "0";
  const size = searchParams.get("size") ?? "20";

  const res = await fetch(
    `${BASE_API_URL}/api/v1/users/students?page=${page}&size=${size}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
