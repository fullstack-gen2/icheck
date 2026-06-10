import { ACCESS_TOKEN_COOKIE, AUTH_API_URL } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getCookie(req: Request, name: string) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function forward(req: Request, method: "PUT" | "DELETE") {
  const accessToken = getCookie(req, ACCESS_TOKEN_COOKIE);

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const res = await fetch(`${AUTH_API_URL}/me/profile-image`, {
    method,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(method === "PUT" ? { "Content-Type": "application/json" } : {}),
    },
    body: method === "PUT" ? await req.text() : undefined,
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data ?? {}, { status: res.status });
}

export async function PUT(req: Request) {
  return forward(req, "PUT");
}

export async function DELETE(req: Request) {
  return forward(req, "DELETE");
}
