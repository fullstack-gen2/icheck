"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { UserProvider } from "@/components/user-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <UserProvider>{children}</UserProvider>
    </ThemeProvider>
  );
}
