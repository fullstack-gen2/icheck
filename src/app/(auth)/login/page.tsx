import { Logo } from "@/components/logo";

// Auth (login/logout) is fully handled by the Gateway BFF (OAuth2 IAM ISTAD).
// The BFF intercepts unauthenticated requests before they reach the app,
// so this page is never shown in normal operation.
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <Logo size={72} />
      <p className="text-sm text-gray-400">Authenticating…</p>
    </div>
  );
}
