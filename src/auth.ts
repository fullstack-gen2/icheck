import { API_URL, AUTH_URL } from "@/lib/api-config";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeServiceUrl(value: string) {
  return trimTrailingSlash(value)
    .replace(/\/api\/v1\/attendance$/, "")
    .replace(/\/api\/v1$/, "");
}

export const SPRING_BOOT_URL = normalizeServiceUrl(
  process.env.ATTENDANCE_SERVICE_URL ??
  process.env.BASE_API_URL ??
  process.env.BACKEND_URL ??
  "https://attendance.icheck.today"
);

export const SPRING_BOOT_PUBLIC_URL = normalizeServiceUrl(
  process.env.ATTENDANCE_PUBLIC_URL ??
  process.env.BACKEND_PUBLIC_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  SPRING_BOOT_URL
);

export const BASE_API_URL =
  `${SPRING_BOOT_URL}/api/v1`;

export const ATTENDANCE_API_URL = `${SPRING_BOOT_URL}${API_URL}`;

export const AUTH_API_URL = `${SPRING_BOOT_URL}${AUTH_URL}`;

export interface AppUser {
  id: string;
  name: string;
  email: string;
  /** Normalized role used for permission gating: ADMIN | TEACHER | STUDENT | USER. */
  role: string;
  /** Human-readable label that mirrors what the API actually returned,
   *  so a SUPER_ADMIN sees "Super Admin" in the UI even though `role`
   *  normalizes to ADMIN for access checks. */
  displayRole: string;
  /** All raw role strings from /auth/me, in original casing. */
  rawRoles: string[];
}

/**
 * Role rules:
 *   - SUPER_ADMIN  → access-equivalent to ADMIN (normalized to "ADMIN")
 *   - Multi-role users → highest privilege wins (ADMIN > TEACHER > STUDENT)
 *   - `displayRole` always reflects the actual API role (Super Admin stays Super Admin).
 */
const ROLE_PRIORITY = ["ADMIN", "TEACHER", "STUDENT"] as const;

function normalizeRole(raw: string): string {
  const upper = raw?.toUpperCase?.() ?? "";
  if (upper === "SUPER_ADMIN" || upper === "SUPERADMIN") return "ADMIN";
  return upper || "USER";
}

/** Human title-case label for a raw role string. */
function humanizeRole(raw: string): string {
  const upper = raw?.toUpperCase?.() ?? "";
  if (upper === "SUPER_ADMIN" || upper === "SUPERADMIN") return "Super Admin";
  if (upper === "ADMIN")   return "Admin";
  if (upper === "TEACHER") return "Teacher";
  if (upper === "STUDENT") return "Student";
  // Generic fallback: title-case + replace underscores with spaces
  return upper
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Pick which raw role drives `displayRole`. Highest privilege still wins,
 * but "Super Admin" beats plain "Admin" when both are present so the
 * elevated role is shown in the UI.
 */
function pickDisplayRoleRaw(rawRoles: string[]): string {
  const upper = rawRoles.map((r) => r.toUpperCase());
  if (upper.some((r) => r === "SUPER_ADMIN" || r === "SUPERADMIN")) return "SUPER_ADMIN";
  if (upper.includes("ADMIN"))   return "ADMIN";
  if (upper.includes("TEACHER")) return "TEACHER";
  if (upper.includes("STUDENT")) return "STUDENT";
  return rawRoles[0] ?? "USER";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAuthMe(p: any): AppUser | null {
  if (!p || typeof p !== "object") return null;
  const username = p.username ?? p.preferred_username ?? "";
  const email    = p.email ?? "";
  if (!username && !email) return null;

  const rawRoles: string[] = Array.isArray(p.roles)
    ? p.roles.map(String)
    : p.role ? [String(p.role)] : [];

  const normalized = rawRoles.map(normalizeRole);
  const role =
    ROLE_PRIORITY.find((r) => normalized.includes(r)) ??
    normalized[0] ??
    "USER";

  return {
    id:    String(username || email),
    name:  String(username || email),
    email: String(email),
    role,
    displayRole: humanizeRole(pickDisplayRoleRaw(rawRoles)),
    rawRoles,
  };
}
