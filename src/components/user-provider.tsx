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
    fetch("/attendance/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const p = json?.payload;
        if (!p) return;
        setUser({
          id: String(p.id ?? ""),
          name: p.name ?? p.username ?? p.email ?? "",
          email: p.email ?? "",
          role: p.role ?? "USER",
        });
      })
      .catch(() => {});
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
