"use client";

import { mapAuthMe } from "@/auth";
import { useGetCurrentUserQuery } from "@/store/api/userApi";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

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
  profileImage: string | null;
}

const UserContext = createContext<AppUser | null>(null);
const UserUpdateContext = createContext<((patch: Partial<AppUser>) => void) | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const { data } = useGetCurrentUserQuery();

  useEffect(() => {
    setUser(mapAuthMe(data));
  }, [data]);

  const updateUser = useCallback((patch: Partial<AppUser>) => {
    setUser((current) => current ? { ...current, ...patch } : current);
  }, []);

  return (
    <UserContext.Provider value={user}>
      <UserUpdateContext.Provider value={updateUser}>
        {children}
      </UserUpdateContext.Provider>
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export function useUpdateUser() {
  return useContext(UserUpdateContext);
}
