import { Logo } from "@/components/logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/50">
      <Logo size={72} />
      <p className="text-sm text-muted-foreground/70">Authenticating- - - -</p>
    </div>
  );
}
