import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";


export const DEVICE_COOKIE = "i-check-device-id";

// ~10 years
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function getDeviceId(): Promise<string | null> {
  const store = await cookies();
  return store.get(DEVICE_COOKIE)?.value ?? null;
}

export function ensureDeviceCookie(req: NextRequest, res: NextResponse): string {
  const existing = req.cookies.get(DEVICE_COOKIE)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  res.cookies.set({
    name:     DEVICE_COOKIE,
    value:    id,
    httpOnly: true,                              // not readable from JS
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",                             // sent on top-level POST nav (sign-in)
    path:     "/",
    maxAge:   TEN_YEARS,
  });
  return id;
}
