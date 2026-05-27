// Auth is handled by the Gateway BFF (OAuth2 IAM ISTAD).
// This route is no longer needed but kept to avoid 404s on existing bookmarks.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Auth is handled by the gateway BFF." }, { status: 200 });
}
export async function POST() {
  return NextResponse.json({ message: "Auth is handled by the gateway BFF." }, { status: 200 });
}
