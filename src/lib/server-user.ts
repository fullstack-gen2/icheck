import { BASE_API_URL } from "@/auth";

/**
 * Get the current user from inside a Next.js Route Handler by forwarding
 * the browser's BFF session cookie to the attendance backend.
 */
export async function getRequestUser(cookieHeader: string) {
  try {
    const res = await fetch(
      `${BASE_API_URL}/api/v1/attendance/users/me`,
      {
        cache: "no-store",
        headers: { Cookie: cookieHeader },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const p = json?.payload;
    if (!p) return null;
    return {
      id: String(p.id ?? ""),
      role: String(p.role ?? "USER"),
      name: String(p.name ?? ""),
    };
  } catch {
    return null;
  }
}
