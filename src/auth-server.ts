import "server-only";

import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, AUTH_API_URL, mapAuthMe, type AppUser } from "@/auth";

export async function getServerUser(): Promise<AppUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) return null;

    const res = await fetch(`${AUTH_API_URL}/me`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      // Surface the reason in Vercel logs — distinguishes "cookie expired"
      // (401) from "endpoint wrong/broken" (404/500).
      const body = await res.text().catch(() => "");
      console.error("[getServerUser] /me returned non-2xx", {
        url: `${AUTH_API_URL}/me`,
        status: res.status,
        body: body.slice(0, 500),
      });
      return null;
    }
    const json = await res.json();
    const user = mapAuthMe(json);
    if (!user) {
      console.error("[getServerUser] /me shape unrecognised by mapAuthMe", json);
    }
    return user;
  } catch (e) {
    console.error("[getServerUser] threw", e);
    return null;
  }
}
