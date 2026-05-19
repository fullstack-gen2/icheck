import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

type AuthRequest = NextRequest & { auth: Session | null };

const PUBLIC_PATHS = ["/login", "/check-in"];
const ADMIN_PATHS = ["/dashboard", "/attendance", "/students", "/schedule", "/sessions", "/settings"];
const STUDENT_PATHS = ["/student"];

export default auth((req: AuthRequest) => {
  const pathname = req.nextUrl.pathname;
  const session = req.auth;
  const role = session?.user?.role;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Not logged in
  if (!session) {
    if (isPublic) return NextResponse.next();
    // Preserve the intended URL so login can redirect back
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in → redirect away from login
  if (pathname.startsWith("/login")) {
    const dest = role === "STUDENT" ? "/student" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // /check-in is open to students only (non-students get redirected to dashboard)
  if (pathname.startsWith("/check-in") && role !== "STUDENT") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath && role === "STUDENT") {
    return NextResponse.redirect(new URL("/student", req.url));
  }

  const isStudentPath = STUDENT_PATHS.some((p) => pathname.startsWith(p));
  if (isStudentPath && role !== "STUDENT") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
