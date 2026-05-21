import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Name of the HttpOnly cookie that identifies a device.
 *
 * The device id is created server-side (middleware) and is never readable by
 * client JavaScript — this matters because attendance enforcement relies on
 * the same student always coming from the same physical device. A localStorage
 * value would be readable / writable by any script running on the page.
 */
export const DEVICE_COOKIE = "i-check-device-id";

// ~10 years
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/**
 * Read the current device id from cookies inside a Server Component, Server
 * Action, or Route Handler. Returns `null` if the visitor has never been
 * issued a cookie (in practice this only happens before middleware runs).
 */
export async function getDeviceId(): Promise<string | null> {
  const store = await cookies();
  return store.get(DEVICE_COOKIE)?.value ?? null;
}

/**
 * Ensure the device cookie exists on the response. Called from middleware so
 * that *every* HTML / API request that doesn't already carry one walks away
 * with a brand new id. Returns the id (so middleware can pass it onward).
 */
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
