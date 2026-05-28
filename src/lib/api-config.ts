/**
 * Client-safe API constants — no server-only imports here so client
 * components ("use client") can pull these in without breaking the build.
 *
 *  - API_URL      : relative gateway prefix for browser fetches.
 *                   `fetch(`${API_URL}/settings`)` resolves to
 *                   `/api/v1/attendance/settings` (same-origin → gateway → backend).
 *  - GATEWAY_HOST : public origin, only useful for absolute URLs you
 *                   embed in QR codes / share links.
 */
export const API_URL = "/api/v1/attendance";

export const GATEWAY_HOST =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "https://insight.istad.co";
