import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/client-ip";

export const dynamic = "force-dynamic";

/**
 * Returns the client IP the server actually sees — the SAME value the
 * attendance check-in proxy sends to the backend's IP allowlist. Lets an admin
 * (on the school Wi-Fi) discover the exact public IP to allowlist, instead of
 * guessing the private 192.168.x.x LAN address (which a cloud server never sees).
 */
export async function GET(req: Request) {
  return NextResponse.json({ ip: getClientIp(req) });
}
