export const BASE_API_URL = process.env.BASE_API_URL;

  // process.env.BASE_API_URL ??
  // process.env.BACKEND_URL;
  //"https://attendance.icheck.today/api/v1";

//=========================================
// Re-exported from the client-safe module so server-only modules can also
// reach for it.
export { API_URL } from "@/lib/api-config";


export const GATEWAY_URL =
  process.env.GATEWAY_URL ??
  process.env.NEXT_PUBLIC_GATEWAY_URL ??
  "https://insight.istad.co";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Maps the gateway's /auth/me response into our AppUser shape.
 *
 * Role normalization rules:
 *   - SUPER_ADMIN  →  ADMIN  (same privileges inside i-Check)
 *   - If the user has multiple roles, prefer ADMIN > TEACHER > STUDENT.
 */
const ROLE_PRIORITY = ["ADMIN", "TEACHER", "STUDENT"] as const;

function normalizeRole(raw: string): string {
  const upper = raw?.toUpperCase?.() ?? "";
  if (upper === "SUPER_ADMIN" || upper === "SUPERADMIN") return "ADMIN";
  return upper || "USER";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAuthMe(p: any): AppUser | null {
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
    id:    String(username || email),
    name:  String(username || email),
    email: String(email),
    role,
  };
}
