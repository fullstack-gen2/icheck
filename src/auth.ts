import { cookies } from "next/headers";

export const BASE_API_URL =
  process.env.BASE_API_URL ?? "https://attendance.icheck.today/api/v1";
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function getServerUser(): Promise<AppUser | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const res = await fetch(
      `${BASE_API_URL}/users/me`,
      {
        cache: "no-store",
        headers: { Cookie: cookieHeader },
      }
    );

    if (!res.ok) return null;
    const json = await res.json();
    const p = json?.payload;
    if (!p) return null;

    return {
      id: String(p.id ?? ""),
      name: p.name ?? p.username ?? p.email ?? "",
      email: p.email ?? "",
      role: p.role ?? "USER",
    };
  } catch {
    return null;
  }
}
