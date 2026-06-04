"use client";

import { GATEWAY_HOST } from "@/lib/api-config";
import { createContext, useContext, useEffect, useState } from "react";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  /** Normalized role for permission gating (ADMIN | TEACHER | STUDENT). */
  role: string;
  /** Human label that mirrors the API ("Super Admin", "Admin", …). */
  displayRole: string;
  /** Raw role strings from /auth/me. */
  rawRoles: string[];
}

/* ── Same logic as src/auth.ts on the server ───────────────────────────── */
const ROLE_PRIORITY = ["ADMIN", "TEACHER", "STUDENT"] as const;

function normalizeRole(raw: string): string {
  const upper = raw?.toUpperCase?.() ?? "";
  if (upper === "SUPER_ADMIN" || upper === "SUPERADMIN") return "ADMIN";
  return upper || "USER";
}

function humanizeRole(raw: string): string {
  const upper = raw?.toUpperCase?.() ?? "";
  if (upper === "SUPER_ADMIN" || upper === "SUPERADMIN") return "Super Admin";
  if (upper === "ADMIN")   return "Admin";
  if (upper === "TEACHER") return "Teacher";
  if (upper === "STUDENT") return "Student";
  return upper
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function pickDisplayRoleRaw(raws: string[]): string {
  const u = raws.map((r) => r.toUpperCase());
  if (u.some((r) => r === "SUPER_ADMIN" || r === "SUPERADMIN")) return "SUPER_ADMIN";
  if (u.includes("ADMIN"))   return "ADMIN";
  if (u.includes("TEACHER")) return "TEACHER";
  if (u.includes("STUDENT")) return "STUDENT";
  return raws[0] ?? "USER";
}

function pickRole(rawRoles: string[]): string {
  const normalized = rawRoles.map(normalizeRole);
  return ROLE_PRIORITY.find((r) => normalized.includes(r)) ?? normalized[0] ?? "USER";
}

/* ── Context ──────────────────────────────────────────────────────────── */

const UserContext = createContext<AppUser | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    fetch(`${GATEWAY_HOST}/api/v1/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!p || typeof p !== "object") return;
        const username = p.username ?? p.preferred_username ?? "";
        const email    = p.email ?? "";
        if (!username && !email) return;

        const rawRoles: string[] = Array.isArray(p.roles)
          ? p.roles.map(String)
          : p.role ? [String(p.role)] : [];

        setUser({
          id:    String(username || email),
          name:  String(username || email),
          email: String(email),
          role:  pickRole(rawRoles),
          displayRole: humanizeRole(pickDisplayRoleRaw(rawRoles)),
          rawRoles,
        });
      })
      .catch(() => {});
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
