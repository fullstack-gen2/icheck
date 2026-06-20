import Link from "next/link";
import type React from "react";
import {
  BellRingIcon,
  CheckCircle2Icon,
  FileSpreadsheetIcon,
  FingerprintIcon,
  LockKeyholeIcon,
  MapPinIcon,
  QrCodeIcon,
  RadioIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoWordmark } from "@/components/logo";

const features = [
  { title: "QR Attendance", description: "Static and dynamic QR sessions for fast classroom check-ins.", icon: QrCodeIcon },
  { title: "GPS Validation", description: "Location checks help keep attendance tied to the actual classroom.", icon: MapPinIcon },
  { title: "Device Control", description: "Student device binding reduces shared-login and proxy attendance risk.", icon: FingerprintIcon },
  { title: "Live Monitoring", description: "Teachers see check-ins update while the session is running.", icon: RadioIcon },
  { title: "Telegram Alerts", description: "Classroom groups receive session alerts and attendance summaries.", icon: BellRingIcon },
  { title: "Reports", description: "Attendance scoring, eligibility warnings, PDF, and Excel-ready exports.", icon: FileSpreadsheetIcon },
];

const plans = [
  { name: "Starter", price: "$29", detail: "For small programs", points: ["300 students", "20 teachers", "20 classes", "Report exports"] },
  { name: "School", price: "$99", detail: "For growing institutes", points: ["1,500 students", "100 teachers", "Telegram alerts", "Report exports"] },
  { name: "Enterprise", price: "Custom", detail: "For multi-campus operations", points: ["High limits", "Custom support", "Advanced controls", "Priority rollout"] },
];

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center">
          <LogoWordmark height={36} />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/features" className="hover:text-foreground">Features</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/security" className="hover:text-foreground">Security</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/api/auth/login?mode=signup">Start free trial</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function DashboardVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(47,72,164,0.18),transparent_40%),linear-gradient(180deg,rgba(248,250,252,0.92),rgba(248,250,252,0.98))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(47,72,164,0.25),transparent_42%),linear-gradient(180deg,rgba(4,6,12,0.88),rgba(4,6,12,0.98))]" />
      <div className="absolute left-1/2 top-28 hidden w-[980px] -translate-x-1/2 opacity-45 blur-[0.2px] lg:block">
        <div className="grid grid-cols-[240px_1fr] overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <div className="space-y-4 border-r border-border p-5">
            <LogoWordmark height={32} />
            {["Dashboard", "Classes", "Schedule", "Reports"].map((item, index) => (
              <div key={item} className={`h-10 rounded-md px-3 py-2 text-sm ${index === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {item}
              </div>
            ))}
          </div>
          <div className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 w-72 rounded bg-foreground/15" />
                <div className="mt-3 h-4 w-96 rounded bg-foreground/10" />
              </div>
              <div className="h-10 w-36 rounded bg-primary" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 rounded-lg border border-border bg-background/80 p-4">
                  <div className="h-4 w-24 rounded bg-foreground/10" />
                  <div className="mt-6 h-8 w-16 rounded bg-primary/40" />
                </div>
              ))}
            </div>
            <div className="h-60 rounded-lg border border-border bg-background/80" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[760px] items-center overflow-hidden pt-16">
      <DashboardVisual />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-24">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-sm text-muted-foreground shadow-sm">
            <ShieldCheckIcon className="size-4 text-primary" />
            30-day free trial for schools and training centers
          </div>
          <h1 className="text-5xl font-semibold tracking-normal text-foreground md:text-7xl">
            Smart Attendance for Modern Classrooms
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
            iCheck helps schools run QR attendance with GPS, device validation, teacher dashboards, student requests, Telegram alerts, and audit-ready reports.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-11 px-5">
              <Link href="/api/auth/login?mode=signup">Start free trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-5">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold">Everything attendance teams expect</h2>
        <p className="mt-3 text-muted-foreground">
          Built for repeated daily use by admins, teachers, and students.
        </p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-lg border border-border bg-card p-5">
            <feature.icon className="size-6 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-20 md:grid-cols-3">
        {[
          ["1", "Create organization", "Sign up, create your school workspace, and start the trial."],
          ["2", "Set classes", "Invite teachers, add students, schedules, policies, and Telegram groups."],
          ["3", "Run attendance", "Teachers start sessions, students scan, and reports stay auditable."],
        ].map(([step, title, description]) => (
          <div key={step} className="rounded-lg border border-border bg-background p-5">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{step}</div>
            <h3 className="mt-5 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-semibold">Plans that grow with your institute</h2>
          <p className="mt-3 text-muted-foreground">Start with a free trial. Upgrade when your team is ready.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/pricing">View pricing</Link>
        </Button>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{plan.detail}</p>
            <div className="mt-6 text-3xl font-semibold">{plan.price}<span className="text-sm font-normal text-muted-foreground"> / month</span></div>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {plan.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <CheckCircle2Icon className="mt-0.5 size-4 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <LockKeyholeIcon className="size-8 text-primary" />
            <h2 className="mt-4 text-3xl font-semibold">Designed for school data boundaries</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Keycloak authentication, role-based access, organization isolation, audit logs, HTTPS, and secure file storage form the SaaS security baseline.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Tenant data isolation", "Keycloak OAuth2/JWT", "Role-based access", "Audit-ready reports"].map((item) => (
              <div key={item} className="rounded-lg border border-border bg-background p-4 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-20">
      <h2 className="text-3xl font-semibold">FAQ</h2>
      <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
        {[
          ["Can we use our own Telegram groups?", "Yes. Each class can connect to a different Telegram group."],
          ["Does iCheck support static and dynamic QR?", "Yes. Static QR supports classroom check-in and dynamic QR supports teacher-started sessions."],
          ["Can policies change later?", "Yes. Reports snapshot attendance policy values so old reports stay stable."],
        ].map(([q, a]) => (
          <div key={q} className="p-5">
            <h3 className="font-semibold">{q}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20">
      <div className="rounded-lg border border-border bg-primary p-8 text-primary-foreground md:p-10">
        <h2 className="text-3xl font-semibold">Start your iCheck workspace</h2>
        <p className="mt-3 max-w-2xl text-primary-foreground/80">
          Create your organization, invite your team, and run your first attendance flow during the free trial.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/api/auth/login?mode=signup">Start free trial</Link>
        </Button>
      </div>
    </section>
  );
}

export function MarketingHome() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <PricingSection />
      <SecuritySection />
      <FAQ />
      <CTA />
    </main>
  );
}

export function MarketingPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-32">
        <h1 className="text-5xl font-semibold">{title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{description}</p>
      </section>
      {children}
      <CTA />
    </main>
  );
}

export { features, plans, FeatureGrid, PricingSection, SecuritySection };
