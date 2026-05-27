"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";

// Login is handled entirely by the Gateway BFF / OAuth2 IAM ISTAD.
// This page is only shown briefly before the redirect fires.
const LOGIN_URL =
  process.env.NEXT_PUBLIC_LOGIN_URL ?? "https://iam.istad.co";

export default function LoginPage() {
  useEffect(() => {
    window.location.href = LOGIN_URL;
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <Logo size={72} />
      <Loader2 className="h-6 w-6 animate-spin text-[#273C97]" />
      <p className="text-sm text-gray-400">Redirecting to ISTAD login…</p>
    </div>
  );
}
