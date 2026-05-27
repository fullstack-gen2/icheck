"use client";

import { Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";

/**
 * Login page — immediately bounces the user to the ISTAD IAM OAuth2 login
 * page. No email/password form lives here; authentication is fully delegated
 * to the IAM provider.
 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginRedirect />
    </Suspense>
  );
}

function LoginRedirect() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Preserve the original destination so the user lands back where they were.
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    } else if (status === "unauthenticated") {
      // Redirect to IAM OAuth2 — user sees the ISTAD Keycloak login form.
      signIn("istad-iam", { callbackUrl });
    }
    // status === "loading" → keep showing the spinner
  }, [status, router, callbackUrl]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <Logo size={72} />
      <Loader2 className="h-6 w-6 animate-spin text-[#273C97]" />
      <p className="text-sm text-gray-400">Redirecting to ISTAD login…</p>
    </div>
  );
}
