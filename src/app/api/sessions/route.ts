import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/auth";
import { getRequestUser } from "@/lib/server-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = searchParams.get("size") ?? "100";
  const cookieHeader = request.headers.get("cookie") ?? "";

  const user = await getRequestUser(cookieHeader);

  if (user?.role === "ADMIN") {
    const today = new Date();
    const from  = new Date(today.getTime() - 30 * 86400_000).toISOString().slice(0, 10);
    const to    = new Date(today.getTime() +  7 * 86400_000).toISOString().slice(0, 10);

    const clsRes  = await fetch(
      `${BASE_API_URL}/api/v1/attendance/classrooms?size=200`,
      { cache: "no-store", headers: { Cookie: cookieHeader } }
    );
    const clsJson = await clsRes.json();
    const classrooms: { id: number }[] = clsJson?.payload?.content ?? [];

    const results = await Promise.all(
      classrooms.map((c) =>
        fetch(
          `${BASE_API_URL}/api/v1/attendance/sessions/classrooms/${c.id}?from=${from}&to=${to}&size=50`,
          { cache: "no-store", headers: { Cookie: cookieHeader } }
        )
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

  // Teacher (or unknown role): fetch their own upcoming sessions
  const teacherId = searchParams.get("teacherId") ?? user?.id ?? "";
  const page      = searchParams.get("page") ?? "0";

  const res = await fetch(
    `${BASE_API_URL}/api/v1/attendance/sessions/teachers/${teacherId}/upcoming?page=${page}&size=${size}`,
    { cache: "no-store", headers: { Cookie: cookieHeader } }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
