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
    if (!res.ok) return null;
    return mapAuthMe(await res.json());
  } catch {
    return null;
  }
}
