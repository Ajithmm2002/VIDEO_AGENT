export const SESSION_IDLE_DAYS = 7;
export const SESSION_MAX_AGE_DAYS = 14;
export const SESSION_IDLE_MS = SESSION_IDLE_DAYS * 24 * 60 * 60 * 1000;
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
export const SESSION_ACTIVE_COOKIE = "cs_active_at";

export type SessionTimeoutReason = "max-age" | "idle";

export function parseTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return numeric < 1e12 ? numeric * 1000 : numeric;
  }
  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function sessionTimeoutReason(input: {
  now?: number;
  lastSignInAt?: string | null;
  activeAt?: string | null;
}): SessionTimeoutReason | null {
  const now = input.now ?? Date.now();
  const started = parseTimestamp(input.lastSignInAt);
  if (started != null && now - Math.min(started, now) > SESSION_MAX_AGE_MS) {
    return "max-age";
  }
  const recorded = parseTimestamp(input.activeAt);
  const active = recorded != null && recorded <= now ? recorded : started;
  if (active != null && now - active > SESSION_IDLE_MS) {
    return "idle";
  }
  return null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.ceil(SESSION_MAX_AGE_MS / 1000),
  };
}
