import { SPRING_BOOT_PUBLIC_URL } from "@/auth";
import { NextResponse } from "next/server";

export function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.redirect(`${SPRING_BOOT_PUBLIC_URL}${url.pathname}${url.search}`);
}
