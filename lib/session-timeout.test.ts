import { describe, expect, it } from "vitest";
import {
  SESSION_IDLE_MS,
  SESSION_MAX_AGE_MS,
  parseTimestamp,
  sessionTimeoutReason,
} from "@/lib/session-timeout";

const now = Date.parse("2026-11-22T08:00:00.000Z");

describe("session timeout", () => {
  it("lets a daily visitor stay signed in until 14 days", () => {
    expect(
      sessionTimeoutReason({
        now,
        lastSignInAt: new Date(now - SESSION_MAX_AGE_MS + 60_000).toISOString(),
        activeAt: String(now - 1_000),
      }),
    ).toBeNull();
  });

  it("keeps a fresh login active", () => {
    expect(
      sessionTimeoutReason({
        now,
        lastSignInAt: new Date(now - 60_000).toISOString(),
        activeAt: String(now - 5_000),
      }),
    ).toBeNull();
  });

  it("ends a session after 14 days even if the person is still using the app", () => {
    expect(
      sessionTimeoutReason({
        now,
        lastSignInAt: new Date(now - SESSION_MAX_AGE_MS - 1_000).toISOString(),
        activeAt: String(now - 1_000),
      }),
    ).toBe("max-age");
  });

  it("ends a session after 7 days without a visit", () => {
    expect(
      sessionTimeoutReason({
        now,
        lastSignInAt: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
        activeAt: String(now - SESSION_IDLE_MS - 1_000),
      }),
    ).toBe("idle");
  });

  it("ignores a future activity stamp so the idle window cannot be stretched", () => {
    expect(
      sessionTimeoutReason({
        now,
        lastSignInAt: new Date(now - SESSION_IDLE_MS - 1_000).toISOString(),
        activeAt: String(now + 60_000),
      }),
    ).toBe("idle");
  });

  it("treats a missing activity cookie as idle after a week away from sign-in", () => {
    expect(
      sessionTimeoutReason({
        now,
        lastSignInAt: new Date(now - SESSION_IDLE_MS - 1_000).toISOString(),
      }),
    ).toBe("idle");
  });

  it("reads unix seconds and ISO dates", () => {
    expect(parseTimestamp("1763798400")).toBe(1763798400_000);
    expect(parseTimestamp("2026-11-22T08:00:00.000Z")).toBe(now);
    expect(parseTimestamp("nope")).toBeNull();
  });
});
