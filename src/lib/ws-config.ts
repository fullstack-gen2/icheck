/**
 * Public WebSocket base URL — what the browser connects directly to (no proxy).
 *
 * The Spring backend exposes `/ws` (SockJS) at the same origin as the REST API.
 * We use `NEXT_PUBLIC_ATTENDANCE_URL` so the value is inlined into the client
 * bundle; falling back to the proxy origin in dev where backend + frontend
 * share localhost.
 */
export const ATTENDANCE_PUBLIC_URL =
  process.env.NEXT_PUBLIC_ATTENDANCE_URL?.replace(/\/+$/, "") ??
  (typeof window === "undefined"
    ? ""
    : window.location.origin.replace(/\/+$/, ""));
