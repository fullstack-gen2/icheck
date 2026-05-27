import { auth } from "@/auth";

/**
 * Server-side fetch that automatically forwards the caller's IAM access_token
 * as a Bearer credential to the attendance backend.
 *
 * Usage inside any Next.js API route:
 *   const res = await backendFetch("/api/v1/classrooms?size=100");
 */

const BASE_API_URL =
  process.env.BASE_API_URL ?? "http://attendance-service:8090";

export async function backendFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const session = await auth();
  const token = session?.user?.backendToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  return fetch(`${BASE_API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers,
  });
}
