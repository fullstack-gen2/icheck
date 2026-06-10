import Link from "next/link";
import { redirect } from "next/navigation";
import { OAUTH2_LOGIN_URL } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { AlertCircleIcon, CheckCircle2Icon, RefreshCwIcon } from "lucide-react";

/**
 * Sign-in screen.
 *  - No `?error` query  → kick straight into the OAuth flow.
 *  - `?error=...`       → show what went wrong so the user is NOT bounced
 *                          back to Keycloak immediately (which previously
 *                          created an infinite Keycloak ↔ callback ↔ /login loop).
 */
const ERROR_MESSAGES: Record<string, string> = {
  oauth_state:    "Login session expired or was tampered with. Please try signing in again.",
  token_exchange: "Keycloak rejected the token exchange. Most likely the server is missing KEYCLOAK_CLIENT_SECRET, or the redirect_uri isn't registered on the Keycloak client. Check the deploy logs.",
  user_fetch:     "Login succeeded with Keycloak but the attendance service didn't return a profile (/api/v1/users/me).",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; logged_out?: string }>;
}) {
  const { error, detail, logged_out: loggedOut } = await searchParams;

  if (!error && !loggedOut) redirect(OAUTH2_LOGIN_URL);

  if (loggedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-sm text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Logo size={56} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1 text-green-600 dark:text-green-400">
            <CheckCircle2Icon className="size-5" />
            <h1 className="font-semibold">Signed out</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Your i-Check session has ended.
          </p>
          <Button asChild className="gap-1.5 w-full">
            <Link href={OAUTH2_LOGIN_URL}>
              <RefreshCwIcon className="size-4" />
              Sign in again
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const description =
    ERROR_MESSAGES[error ?? ""] ?? `Authentication failed (code: ${error}).`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-sm text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <Logo size={56} />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1 text-red-600 dark:text-red-400">
          <AlertCircleIcon className="size-5" />
          <h1 className="font-semibold">Sign-in failed</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        <code className="block bg-muted text-xs text-muted-foreground rounded-lg px-3 py-2 mb-6 font-mono">
          {error}
        </code>
        {detail ? (
          <code className="block bg-muted text-xs text-muted-foreground rounded-lg px-3 py-2 mb-6 font-mono break-words">
            {detail}
          </code>
        ) : null}
        <Button asChild className="gap-1.5 w-full">
          <Link href={OAUTH2_LOGIN_URL}>
            <RefreshCwIcon className="size-4" />
            Try again
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground/60 mt-6">
          If this persists, check Vercel env vars and the Keycloak client config.
        </p>
      </div>
    </div>
  );
}
