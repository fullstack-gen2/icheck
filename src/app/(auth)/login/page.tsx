import Link from "next/link";
import { OAUTH2_LOGIN_URL } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { LogoWordmark } from "@/components/logo";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  FingerprintIcon,
  MailIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_state:    "Login session expired or was tampered with. Please try signing in again.",
  token_exchange: "Keycloak rejected the token exchange. Most likely the server is missing KEYCLOAK_CLIENT_SECRET, or the redirect_uri isn't registered on the Keycloak client. Check the deploy logs.",
  user_fetch:     "Login succeeded with Keycloak but the attendance service didn't return a profile (/api/v1/users/me).",
  device_mismatch: "This account is already registered to a different device. Ask an administrator to reset your device, then try again from your registered device.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { error, detail } = await searchParams;

  const description = error
    ? ERROR_MESSAGES[error] ?? `Authentication failed (code: ${error}).`
    : null;

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      <section className="hidden border-r border-border bg-muted/30 px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="w-fit">
          <LogoWordmark height={42} />
        </Link>
        <div className="max-w-xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground">
            <ShieldCheckIcon className="size-4 text-primary" />
            Secure SaaS attendance workspace
          </p>
          <h1 className="text-5xl font-semibold leading-tight">
            Smart Attendance for Modern Classrooms
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Sign in to manage QR attendance, GPS checks, classroom reports, Telegram alerts, and organization settings.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground">
          {["Tenant data isolation", "Keycloak OAuth2 login", "Audit-ready attendance records"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4 text-primary" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <LogoWordmark height={44} />
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-semibold">Welcome to iCheck</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in or start your organization trial.
              </p>
            </div>

            {description ? (
              <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircleIcon className="size-4" />
                  Sign-in failed
                </div>
                <p className="mt-2 leading-6">{description}</p>
                <code className="mt-3 block rounded bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                  {error}
                </code>
                {detail ? (
                  <code className="mt-2 block break-words rounded bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                    {detail}
                  </code>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-3">
              <Button asChild className="h-11 gap-2">
                <Link href={OAUTH2_LOGIN_URL}>
                  <FingerprintIcon className="size-4" />
                  Sign in
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 gap-2">
                <Link href="/api/auth/login?mode=signup">
                  <MailIcon className="size-4" />
                  Sign up with email
                </Link>
              </Button>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild variant="outline" className="h-11">
                  <Link href="/api/auth/login?idp=google">Continue with Google</Link>
                </Button>
                <Button asChild variant="outline" className="h-11">
                  <Link href="/api/auth/login?idp=facebook">Continue with Facebook</Link>
                </Button>
              </div>
            </div>

            {error ? (
              <Button asChild variant="ghost" className="mt-4 w-full gap-2">
                <Link href={OAUTH2_LOGIN_URL}>
                  <RefreshCwIcon className="size-4" />
                  Try again
                </Link>
              </Button>
            ) : null}
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Authentication is handled by Keycloak. iCheck never stores provider passwords.
          </p>
        </div>
      </section>
    </main>
  );
}
