import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BASE_API_URL = process.env.BASE_API_URL ?? "http://localhost:8090";

// Force per-request execution — without this, Next.js may cache the first
// response (e.g. a pre-login 401) and keep serving it indefinitely.
export const dynamic = "force-dynamic";

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

    const clsRes  = await fetch(`${BASE_API_URL}/api/v1/classrooms?size=200`, { cache: "no-store" });
    const clsJson = await clsRes.json();
    const classrooms: { id: number }[] = clsJson?.payload?.content ?? [];

    const results = await Promise.all(
      classrooms.map((c) =>
        fetch(`${BASE_API_URL}/api/v1/sessions/classrooms/${c.id}?from=${from}&to=${to}&size=50`, { cache: "no-store" })
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
    `${BASE_API_URL}/api/v1/sessions/teachers/${teacherId}/upcoming?page=${page}&size=${size}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
