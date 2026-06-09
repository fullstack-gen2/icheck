import "server-only";

import { cookies } from "next/headers";
import { AUTH_API_URL, mapAuthMe, type AppUser } from "@/auth";

export async function getServerUser(): Promise<AppUser | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const res = await fetch(`${AUTH_API_URL}/me`, {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
    });
    if (!res.ok) return null;
    return mapAuthMe(await res.json());
  } catch {
    return null;
  }
}
