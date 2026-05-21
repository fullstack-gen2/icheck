import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8090";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const size = searchParams.get("size") ?? "100";

  // Admin: fetch sessions from all classrooms within a rolling date window
  if (session.user.role === "ADMIN") {
    const today = new Date();
    const from  = new Date(today.getTime() - 30 * 86400_000).toISOString().slice(0, 10);
    const to    = new Date(today.getTime() +  7 * 86400_000).toISOString().slice(0, 10);

    const clsRes  = await fetch(`${BACKEND_URL}/api/classrooms?size=200`, { cache: "no-store" });
    const clsJson = await clsRes.json();
    const classrooms: { id: number }[] = clsJson?.payload?.content ?? [];

    const results = await Promise.all(
      classrooms.map((c) =>
        fetch(`${BACKEND_URL}/api/sessions/classrooms/${c.id}?from=${from}&to=${to}&size=50`, { cache: "no-store" })
          .then((r) => r.json())
          .then((j) => j?.payload?.content ?? [])
          .catch(() => [])
      )
    );

    const combined = (results.flat() as Record<string, string>[])
      .sort((a, b) =>
        (b.sessionDate + b.startTime).localeCompare(a.sessionDate + a.startTime)
      );

    return NextResponse.json({
      success: true,
      payload: { content: combined, totalElements: combined.length },
    });
  }

  // Teacher: fetch their own upcoming sessions
  const teacherId = searchParams.get("teacherId") ?? session.user.userId;
  const page      = searchParams.get("page") ?? "0";

  const res  = await fetch(
    `${BACKEND_URL}/api/sessions/teachers/${teacherId}/upcoming?page=${page}&size=${size}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
