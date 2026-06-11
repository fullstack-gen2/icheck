import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, BASE_API_URL } from "@/auth";

/**
 * Generic authenticated proxy for the RTK Query `baseApi` (`baseUrl: "/api/v1"`).
 *
 * The attendance-service backend is an OAuth2 resource server that only accepts
 * a JWT via the `Authorization: Bearer <token>` header — it ignores cookies.
 * Our access token is stored in an httpOnly cookie (`icheck_access_token`), so
 * client-side `fetch`/RTK Query calls can never attach it directly. This route
 * reads the cookie server-side and forwards the request to the real backend
 * with the bearer token attached, returning the response as-is.
 *
 * Without this, every `/api/v1/*` call from `baseApi` (settings, classrooms,
 * reports, sessions, QR codes, etc.) hits the backend with no credentials and
 * gets `401 Unauthorized`.
 */

export const dynamic = "force-dynamic";

function getCookie(req: Request, name: string) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function proxy(req: Request, path: string[]) {
  const accessToken = getCookie(req, ACCESS_TOKEN_COOKIE);

  const url = new URL(req.url);
  const target = `${BASE_API_URL}/${path.map(encodeURIComponent).join("/")}${url.search}`;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  const accept = req.headers.get("accept");
  if (accept) headers["Accept"] = accept;
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.arrayBuffer();
    if (body.byteLength > 0) init.body = body;
  }

  let res: Response;
  try {
    res = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { error: "Upstream attendance service unreachable." },
      { status: 502 }
    );
  }

  if (res.status === 204 || res.status === 304) {
    return new NextResponse(null, { status: res.status });
  }

  const responseHeaders = new Headers();
  const resContentType = res.headers.get("content-type");
  if (resContentType) responseHeaders.set("content-type", resContentType);

  const buf = await res.arrayBuffer();
  return new NextResponse(buf, { status: res.status, headers: responseHeaders });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(req: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxy(req, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
