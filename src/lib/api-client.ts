/**
 * Tiny client-side fetch helper for the BFF gateway.
 * Same-origin, cookies travel automatically.
 *
 *   await api.get("/classrooms?size=100")
 *   await api.post("/classrooms", body)
 *   await api.patch(`/classrooms/${id}`, body)
 *   await api.del(`/classrooms/${id}`)
 *
 * Throws an Error with a friendly message on non-2xx so callers can catch
 * once and surface via toast.
 */
import { API_URL } from "@/lib/api-config";

async function request(
  path: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown
) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  // Some endpoints return empty body on delete
  const json = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      json?.payload?.message ??
      json?.message ??
      json?.error ??
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}

export const api = {
  get:   (path: string) => request(path, "GET"),
  post:  (path: string, body: unknown) => request(path, "POST", body),
  patch: (path: string, body: unknown) => request(path, "PATCH", body),
  put:   (path: string, body: unknown) => request(path, "PUT", body),
  del:   (path: string) => request(path, "DELETE"),
};
