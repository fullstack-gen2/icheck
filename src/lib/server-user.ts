import { GATEWAY_URL } from "@/auth";

const ROLE_PRIORITY = ["ADMIN", "TEACHER", "STUDENT"] as const;
function normalizeRole(raw: string): string {
  const upper = raw?.toUpperCase?.() ?? "";
  if (upper === "SUPER_ADMIN" || upper === "SUPERADMIN") return "ADMIN";
  return upper || "USER";
}

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

    const rolesRaw: string[] = Array.isArray(p.roles)
      ? p.roles.map(String)
      : p.role ? [String(p.role)] : [];
    const normalized = rolesRaw.map(normalizeRole);
    const role =
      ROLE_PRIORITY.find((r) => normalized.includes(r)) ??
      normalized[0] ??
      "USER";

    return {
      id:   String(username || email),
      name: String(username || email),
      role,
    };
  } catch {
    return null;
  }
}
