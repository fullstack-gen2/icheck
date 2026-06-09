
import { cookies } from "next/headers";
import { ATTENDANCE_API_URL, SPRING_BOOT_URL } from "@/auth";

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

  const url = path.startsWith("/api/")
    ? `${SPRING_BOOT_URL}${path}`
    : `${ATTENDANCE_API_URL}${path}`;

  return fetch(url, {
    cache: "no-store",
    ...init,
    headers,
  });
}
