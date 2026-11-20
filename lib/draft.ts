"use client";

export function readDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeDraft(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full store should not block typing.
  }
}

export function mergeDraft<T extends Record<string, unknown>>(key: string, partial: Partial<T>) {
  const current = readDraft<T>(key);
  writeDraft(key, { ...(current ?? {}), ...partial });
}

export function clearDraft(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
