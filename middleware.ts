import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

type AuthRequest = NextRequest & { auth: Session | null };

const PUBLIC_PATHS = ["/login"];
const ADMIN_PATHS = ["/dashboard", "/attendance", "/students", "/schedule"];
const STUDENT_PATHS = ["/student"];

export default auth((req: AuthRequest) => {
  const pathname = req.nextUrl.pathname;
  const session = req.auth;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!session) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user?.role;

  // Already logged in → redirect away from login
  if (isPublic) {
    const dest = role === "STUDENT" ? "/student" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
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
