// Local-time date helpers.
//
// The app is local-first and every "day" the user sees (meal dates, streaks,
// daily challenges, water) is a *local* calendar day. Using
// `new Date().toISOString().split('T')[0]` returns a UTC day, which silently
// shifts the boundary for anyone not on UTC. All date keys must go through
// these helpers.

/** `YYYY-MM-DD` for the given date in the user's local timezone. */
export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today's local date key. */
export function todayKey(): string {
  return toDateKey();
}

/** Date key `n` days before (negative) or after (positive) the given date. */
export function shiftDateKey(days: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Parse a `YYYY-MM-DD` key into a local Date at midnight. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Whole days between two date keys (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((fromDateKey(b).getTime() - fromDateKey(a).getTime()) / 86400000);
}
