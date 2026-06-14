import { schoolNowMinutes, timeToMinutes } from "@/lib/school-time";

/**
 * Pure session-window helpers — no server-only imports (safe in client
 * components). Kept separate from session-helpers.ts, which pulls in
 * backendFetch → next/headers and therefore can't be imported client-side.
 */

export function isOpenableStatus(status?: string | null) {
  return status === "UPCOMING" || status === "SCHEDULED";
}

/** Minimal shape needed to decide whether a teacher can open the QR. */
export interface StartableSession {
  status?: string | null;
  startTime?: string | null;
  earlyCheckinMinutes?: number | null;
  lateThresholdMinutes?: number | null;
}

/**
 * A session is openable from `earlyCheckinMinutes` before its scheduled start
 * until `lateThresholdMinutes` after it. Past the late threshold the teacher
 * can no longer open the QR — they must use the Amendment form. Both bounds
 * come from the session (system settings), not hardcoded values.
 */
export function isTeacherStartableSession(session: StartableSession) {
  if (session.status === "ACTIVE") return true;
  if (!isOpenableStatus(session.status)) return false;
  const start = timeToMinutes(session.startTime);
  if (start == null) return false;
  const now = schoolNowMinutes();
  const early = session.earlyCheckinMinutes ?? 10;
  const late = session.lateThresholdMinutes ?? 10;
  return now >= start - early && now <= start + late;
}
