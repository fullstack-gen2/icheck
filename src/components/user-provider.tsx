"use client";

import { createContext, useContext, useEffect, useState } from "react";
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Same normalization the server uses (auth.ts) — SUPER_ADMIN = ADMIN,
// pick the highest-privilege role if the user has several.
const ROLE_PRIORITY = ["ADMIN", "TEACHER", "STUDENT"] as const;
function normalizeRole(raw: string): string {
  const upper = raw?.toUpperCase?.() ?? "";
  if (upper === "SUPER_ADMIN" || upper === "SUPERADMIN") return "ADMIN";
  return upper || "USER";
}
function pickRole(roles: string[] | undefined, fallback?: string): string {
  const all = (roles ?? []).map(String).map(normalizeRole);
  if (fallback && all.length === 0) return normalizeRole(fallback);
  return ROLE_PRIORITY.find((r) => all.includes(r)) ?? all[0] ?? "USER";
}

const UserContext = createContext<AppUser | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!p || typeof p !== "object") return;
        const username = p.username ?? p.preferred_username ?? "";
        const email    = p.email ?? "";
        if (!username && !email) return;

        setUser({
          id:    String(username || email),
          name:  String(username || email),
          email: String(email),
          role:  pickRole(p.roles, p.role),
        });
      })
      .catch(() => {});
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
