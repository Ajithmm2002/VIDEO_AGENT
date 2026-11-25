/**
 * Weekly publishing goal and streak. Weeks run Monday to Sunday in India time (UTC+5:30),
 * because the studio is built for Indian creators and a post at 11 pm IST should count that day.
 */

export const DEFAULT_WEEKLY_GOAL = 3;
export const MAX_WEEKLY_GOAL = 21;
const IST_OFFSET_MINUTES = 330;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The Monday (YYYY-MM-DD, India time) of the week that contains this moment. */
export function weekStart(date: Date, offsetMinutes = IST_OFFSET_MINUTES) {
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  const day = local.getUTCDay();
  const sinceMonday = (day + 6) % 7;
  const monday = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - sinceMonday));
  return monday.toISOString().slice(0, 10);
}

function shiftWeek(start: string, weeks: number) {
  const date = new Date(`${start}T00:00:00Z`);
  return new Date(date.getTime() + weeks * 7 * DAY_MS).toISOString().slice(0, 10);
}

export type WeeklyProgress = {
  goal: number;
  thisWeek: number;
  remaining: number;
  /** Consecutive weeks that met the goal, ending this week if it is already met, else last week. */
  streak: number;
  /** Oldest first; the last entry is this week. */
  weeks: Array<{ start: string; count: number; met: boolean }>;
};

export function weeklyProgress(publishedAt: Array<string | null>, goal: number, now = new Date(), history = 8): WeeklyProgress {
  const safeGoal = Math.min(MAX_WEEKLY_GOAL, Math.max(1, Math.round(goal) || DEFAULT_WEEKLY_GOAL));
  const counts = new Map<string, number>();
  for (const value of publishedAt) {
    if (!value) continue;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.getTime() > now.getTime() + DAY_MS) continue;
    const key = weekStart(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const current = weekStart(now);
  const thisWeek = counts.get(current) ?? 0;

  let streak = thisWeek >= safeGoal ? 1 : 0;
  for (let back = 1; back < 260; back += 1) {
    if ((counts.get(shiftWeek(current, -back)) ?? 0) >= safeGoal) streak += 1;
    else break;
  }

  const weeks = Array.from({ length: history }, (_, index) => {
    const start = shiftWeek(current, index - (history - 1));
    const count = counts.get(start) ?? 0;
    return { start, count, met: count >= safeGoal };
  });

  return { goal: safeGoal, thisWeek, remaining: Math.max(0, safeGoal - thisWeek), streak, weeks };
}
