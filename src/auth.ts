import { cookies } from "next/headers";


export const BASE_API_URL = process.env.BASE_API_URL;

  // process.env.BASE_API_URL ??
  // process.env.BACKEND_URL;
  //"https://attendance.icheck.today/api/v1";


export const GATEWAY_URL =
  process.env.GATEWAY_URL ??
  process.env.NEXT_PUBLIC_GATEWAY_URL ??
  "https://insight.istad.co";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

/** Maps the gateway's /auth/me response into our AppUser shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAuthMe(p: any): AppUser | null {
  if (!p || typeof p !== "object") return null;
  const username = p.username ?? p.preferred_username ?? "";
  const email    = p.email ?? "";
  if (!username && !email) return null;

  return {
    id:    String(username || email),
    name:  String(username || email),
    email: String(email),
    role:  Array.isArray(p.roles) && p.roles.length > 0
      ? String(p.roles[0])
      : (p.role ?? "USER"),
  };
}

export async function getServerUser(): Promise<AppUser | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const res = await fetch(`${GATEWAY_URL}/api/v1/auth/me`, {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
    });
    if (!res.ok) return null;
    return mapAuthMe(await res.json());
  } catch {
    return null;
  }
}
