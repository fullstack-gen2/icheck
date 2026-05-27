"use client";

import { UserProvider } from "@/components/user-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
