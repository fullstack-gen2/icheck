import { cookies } from "next/headers";
import { GATEWAY_URL } from "@/auth";
import { API_URL, ICHECK_URL } from "@/lib/api-config";

/**
 * Server-side helper for hitting the BFF gateway.
 *
 * Browser code can just call `fetch("/api/v1/attendance/settings")` — it's
 * same-origin with the gateway and cookies travel automatically. Server
 * components run inside Node, so they need both an absolute URL AND the
 * incoming request's cookies forwarded by hand.
 *
 *   backendFetch("/settings")  →  GET   https://insight.istad.co/api/v1/attendance/settings
 *   backendFetch("/sessions/12/open", { method: "POST" })
 */
export async function backendFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const headers: Record<string, string> = {
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  return fetch(`${ICHECK_URL}${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers,
  });
}
