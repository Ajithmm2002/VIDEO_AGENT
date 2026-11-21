export const gameIds = ["memory", "catch", "sparks"] as const;
export type GameId = (typeof gameIds)[number];

export const COIN_RUPEE_VALUE = 1;
export const MAX_COINS_PER_CLAIM = 18;
export const MIN_CLAIM_MS = 20_000;
export const DAILY_COIN_CAP = 500;

export function previewGameCoins(score: number, durationMs: number) {
  const duration = Math.min(Math.max(Math.floor(durationMs), 0), 1_800_000);
  if (duration < MIN_CLAIM_MS) return 0;
  const scoreCap = Math.min(Math.max(Math.floor(score), 0), Math.floor(duration / 50), 20_000);
  return Math.min(MAX_COINS_PER_CLAIM, Math.floor(scoreCap / 15) + Math.floor(duration / 30_000));
}

export function priceInCoins(paise: number) {
  if (paise <= 0) return 0;
  return Math.ceil(paise / 100);
}

export function formatCoins(coins: number) {
  return `${Math.max(0, Math.floor(coins))} coin${Math.floor(coins) === 1 ? "" : "s"}`;
}

export function isGameId(value: string): value is GameId {
  return gameIds.includes(value as GameId);
}
