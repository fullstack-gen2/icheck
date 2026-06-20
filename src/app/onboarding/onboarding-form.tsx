"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRightIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const plans = [
  {
    code: "STARTER",
    name: "Starter",
    description: "300 students, 20 teachers, 20 classes",
  },
  {
    code: "SCHOOL",
    name: "School",
    description: "1,500 students, Telegram alerts, reports",
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    description: "High limits and custom support",
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function OnboardingForm({ email }: { email: string }) {
  const [organizationName, setOrganizationName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactEmail, setContactEmail] = useState(email);
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [expectedStudents, setExpectedStudents] = useState("100");
  const [selectedPlanCode, setSelectedPlanCode] = useState("STARTER");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.code === selectedPlanCode) ?? plans[0],
    [selectedPlanCode],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/v1/onboarding/organization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationName,
        slug,
        contactEmail,
        contactPhone,
        address,
        expectedStudents: Number(expectedStudents),
        selectedPlanCode,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      setSubmitting(false);
      setError(body || "Could not create organization. Please check the form.");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="organization-name">
          Organization name
        </label>
        <Input
          id="organization-name"
          required
          value={organizationName}
          onChange={(event) => {
            const value = event.target.value;
            setOrganizationName(value);
            setSlug((current) => current || slugify(value));
          }}
          placeholder="ISTAD"
          className="h-11"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="organization-slug">
          Workspace slug
        </label>
        <Input
          id="organization-slug"
          required
          value={slug}
          onChange={(event) => setSlug(slugify(event.target.value))}
          placeholder="istad"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens. Used as your organization identifier.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="contact-email">
            Contact email
          </label>
          <Input
            id="contact-email"
            type="email"
            required
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            className="h-11"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="contact-phone">
            Phone
          </label>
          <Input
            id="contact-phone"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            placeholder="+855..."
            className="h-11"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="address">
          Address
        </label>
        <Textarea
          id="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Campus address"
          className="min-h-24"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="expected-students">
            Expected students
          </label>
          <Input
            id="expected-students"
            type="number"
            min={1}
            required
            value={expectedStudents}
            onChange={(event) => setExpectedStudents(event.target.value)}
            className="h-11"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Plan</label>
          <Select value={selectedPlanCode} onValueChange={setSelectedPlanCode}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.code} value={plan.code}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/35 p-4">
        <div className="flex items-center gap-2 font-medium">
          <CheckCircle2Icon className="size-4 text-primary" />
          {selectedPlan.name} trial
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {selectedPlan.description}. Your organization starts with a 30-day free trial.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button type="submit" className="h-11 gap-2" disabled={submitting}>
        {submitting ? "Creating workspace..." : "Create workspace"}
        <ArrowRightIcon className="size-4" />
      </Button>
    </form>
  );
}
