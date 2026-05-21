"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // The app runs under basePath "/attendance" (see next.config.ts).
  // Without this prop, SessionProvider fetches /api/auth/session instead of
  // /attendance/api/auth/session and gets a 404 HTML page (breaks JSON parse).
  return (
    <SessionProvider basePath="/attendance/api/auth">
      {children}
    </SessionProvider>
  );
}
