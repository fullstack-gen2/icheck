"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { UserProvider } from "@/components/user-provider";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ReduxProvider store={store}>
        <UserProvider>{children}</UserProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
