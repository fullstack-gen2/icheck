import { cookies } from "next/headers";
import { BASE_API_URL } from "@/auth";

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
    "Content-Type": "application/json",
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  return fetch(`${BASE_API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers,
  });
}
