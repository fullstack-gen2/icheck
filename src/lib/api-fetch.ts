
import { cookies } from "next/headers";
import { GATEWAY_URL } from "@/auth";
import { API_URL } from "@/lib/api-config";

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

  return fetch(`${GATEWAY_URL}${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers,
  });
}
