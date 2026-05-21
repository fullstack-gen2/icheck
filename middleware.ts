import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { ensureDeviceCookie } from "@/lib/device-cookie";

type AuthRequest = NextRequest & { auth: Session | null };

// Mirrors next.config.ts `basePath`. NextResponse.redirect does NOT auto-prepend
// the basePath, so every destination URL we build here must include it.
const BASE_PATH = "/attendance";

const PUBLIC_PATHS = ["/login", "/check-in"];
const ADMIN_PATHS = ["/dashboard", "/attendance", "/students", "/schedule", "/sessions", "/settings", "/reports"];
const STUDENT_PATHS = ["/student"];

/**
 * Issue or refresh the HttpOnly device cookie on every response. Doing this
 * here (instead of from client JS) means the value is never exposed to page
 * scripts — it's the long-lived hardware fingerprint backend uses to detect
 * proxy / multi-device cheating.
 */
function withDeviceCookie(req: NextRequest, res: NextResponse): NextResponse {
  ensureDeviceCookie(req, res);
  return res;
}

export default auth((req: AuthRequest) => {
  const pathname = req.nextUrl.pathname;
  const session = req.auth;
  const role = session?.user?.role;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Not logged in
  if (!session) {
    if (isPublic) return withDeviceCookie(req, NextResponse.next());
    // Preserve the intended URL so login can redirect back.
    // pathname is already basePath-stripped by Next.js, so it's safe to use as
    // the callbackUrl payload (the client router will re-prepend basePath).
    const loginUrl = new URL(`${BASE_PATH}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return withDeviceCookie(req, NextResponse.redirect(loginUrl));
  }

  // Logged in → redirect away from login
  if (pathname.startsWith("/login")) {
    const dest = role === "STUDENT" ? `${BASE_PATH}/student` : `${BASE_PATH}/dashboard`;
    return withDeviceCookie(req, NextResponse.redirect(new URL(dest, req.url)));
  }

  // /check-in is open to students only (non-students get redirected to dashboard)
  if (pathname.startsWith("/check-in") && role !== "STUDENT") {
    return withDeviceCookie(req, NextResponse.redirect(new URL(`${BASE_PATH}/dashboard`, req.url)));
  }

  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath && role === "STUDENT") {
    return withDeviceCookie(req, NextResponse.redirect(new URL(`${BASE_PATH}/student`, req.url)));
  }

  const isStudentPath = STUDENT_PATHS.some((p) => pathname.startsWith(p));
  if (isStudentPath && role !== "STUDENT") {
    return withDeviceCookie(req, NextResponse.redirect(new URL(`${BASE_PATH}/dashboard`, req.url)));
  }

  return withDeviceCookie(req, NextResponse.next());
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
