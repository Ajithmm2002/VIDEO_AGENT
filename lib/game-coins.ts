export const gameIds = ["memory", "catch", "sparks"] as const;
export type GameId = (typeof gameIds)[number];

export const COINS_PER_RUPEE = 10;
export const MAX_COINS_PER_CLAIM = 12;
export const MIN_CLAIM_MS = 20_000;
export const DAILY_COIN_CAP = 400;
export const WALLET_COIN_CAP = 10_000_000;

export type GameWallet = {
  coins: number;
  earned: number;
};

export function previewGameCoins(score: number, durationMs: number) {
  const duration = Math.min(Math.max(Math.floor(durationMs), 0), 1_800_000);
  if (duration < MIN_CLAIM_MS) return 0;
  const scoreCap = Math.min(Math.max(Math.floor(score), 0), Math.floor(duration / 80), 12_000);
  return Math.min(MAX_COINS_PER_CLAIM, Math.floor(scoreCap / 30) + Math.floor(duration / 40_000));
}

export function priceInCoins(paise: number) {
  if (paise <= 0) return 0;
  return Math.ceil((Math.max(0, paise) * COINS_PER_RUPEE) / 100);
}

export function formatCoins(coins: number) {
  const value = Math.max(0, Math.floor(coins));
  return `${value.toLocaleString("en-IN")} coin${value === 1 ? "" : "s"}`;
}

export function formatCoinBalance(coins: number) {
  return `🪙 ${formatCoins(coins)}`;
}

export function clampWalletCoins(value: unknown) {
  const coins = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(WALLET_COIN_CAP, Math.floor(coins)));
}

export function isGameId(value: string): value is GameId {
  return gameIds.includes(value as GameId);
}
