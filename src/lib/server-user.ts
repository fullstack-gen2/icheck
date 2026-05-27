import { GATEWAY_URL } from "@/auth";

export async function getRequestUser(cookieHeader: string) {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/v1/auth/me`, {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
    });
    if (!res.ok) return null;
    const p = await res.json();
    if (!p || typeof p !== "object") return null;

    const username = p.username ?? p.preferred_username ?? "";
    const email    = p.email ?? "";
    if (!username && !email) return null;

    return {
      id:   String(username || email),
      name: String(username || email),
      role:
        Array.isArray(p.roles) && p.roles.length > 0
          ? String(p.roles[0])
          : String(p.role ?? "USER"),
    };
  } catch {
    return null;
  }
}
