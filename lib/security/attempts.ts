const hits = new Map<string, number[]>();

export function tooManyAttempts(key: string, limit = 8, windowMs = 15 * 60 * 1000, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    const oldest = hits.keys().next().value;
    if (oldest) hits.delete(oldest);
  }
  return false;
}
