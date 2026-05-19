import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId") ?? session.user.userId;
  const page = searchParams.get("page") ?? "0";
  const size = searchParams.get("size") ?? "20";

  const res = await fetch(
    `${BACKEND_URL}/api/sessions/teachers/${teacherId}/upcoming?page=${page}&size=${size}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
