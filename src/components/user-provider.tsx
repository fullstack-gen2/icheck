"use client";

import { createContext, useContext, useEffect, useState } from "react";
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
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
          role:
            Array.isArray(p.roles) && p.roles.length > 0
              ? String(p.roles[0])
              : (p.role ?? "USER"),
        });
      })
      .catch(() => {});
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
