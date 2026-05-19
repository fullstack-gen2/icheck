"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Role = "STUDENT" | "ADMIN";

function getOrCreateDeviceId(): string {
  const key = "i-check-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Always pass deviceId — backend ignores it for non-STUDENT roles
    const deviceId = getOrCreateDeviceId();

    const result = await signIn("credentials", {
      email,
      password,
      deviceId,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        role === "STUDENT"
          ? "Invalid email or password."
          : "Invalid credentials. Check your email and password."
      );
      return;
    }

    // Fetch session to get role then redirect
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const userRole = session?.user?.role;

    if (userRole === "STUDENT") {
      router.push("/student");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-4 pb-2">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#273C97] text-white font-bold text-sm">
            iC
          </div>
          <span className="text-xl font-bold tracking-tight">i-Check</span>
        </div>

        {/* Role tabs */}
        <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          {(["STUDENT", "ADMIN"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setError(""); }}
              className={cn(
                "flex-1 rounded-md py-1.5 text-sm font-medium transition-all",
                role === r
                  ? "bg-white text-[#273C97] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {r === "STUDENT" ? "Student" : "Admin / Teacher"}
            </button>
          ))}
        </div>

        <CardTitle className="text-xl font-semibold">
          {role === "STUDENT" ? "Student Sign in" : "Admin Sign in"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={
                role === "STUDENT"
                  ? "student@example.com"
                  : "admin@example.com"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {role === "STUDENT" && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-md px-3 py-2">
              Your device is identified automatically for attendance tracking.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-100">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-[#273C97] hover:bg-[#1e2e7a] text-white"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
