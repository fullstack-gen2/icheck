"use client";

import { mapAuthMe } from "@/auth";
import { AUTH_URL } from "@/lib/api-config";
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

const UserContext = createContext<AppUser | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    fetch(`${AUTH_URL}/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        const user = mapAuthMe(p);
        if (user) setUser(user);
      })
      .catch(() => {});
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
