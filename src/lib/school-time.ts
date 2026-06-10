
export const SCHOOL_TZ =
  process.env.SCHOOL_TZ ??
  process.env.NEXT_PUBLIC_SCHOOL_TZ ??
  "Asia/Phnom_Penh";

const DAY_NAMES = [
  "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY",
  "THURSDAY", "FRIDAY", "SATURDAY",
] as const;
export type WeekdayName = typeof DAY_NAMES[number];

/** YYYY-MM-DD in the school's timezone (for comparing with `sessionDate`). */
export function todayIso(now: Date = new Date()): string {
  // en-CA gives us ISO order: YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** "MONDAY" / "TUESDAY" / … in the school's timezone. */
export function todayWeekday(now: Date = new Date()): WeekdayName {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHOOL_TZ,
    weekday: "long",
  }).format(now).toUpperCase();
  // Narrow to our union — if Intl ever returns something off, default to MONDAY.
  return (DAY_NAMES as readonly string[]).includes(name)
    ? (name as WeekdayName)
    : "MONDAY";
}

/** Convenience — both at once, computed from the same moment. */
export function schoolToday(): { iso: string; weekday: WeekdayName } {
  const now = new Date();
  return { iso: todayIso(now), weekday: todayWeekday(now) };
}
