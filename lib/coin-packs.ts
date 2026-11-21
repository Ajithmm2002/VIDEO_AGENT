import { COINS_PER_RUPEE, formatCoins, priceInCoins } from "@/lib/game-coins";
import { formatSkillPrice } from "@/lib/marketplace-file";

export type CoinPack = {
  id: string;
  label: string;
  coins: number;
  pricePaise: number;
};

export const coinPacks: CoinPack[] = [
  { id: "starter", label: "Starter", coins: 2_000, pricePaise: 2_000 },
  { id: "studio", label: "Studio", coins: 5_000, pricePaise: 5_000 },
  { id: "pro", label: "Pro", coins: 10_000, pricePaise: 10_000 },
  { id: "bundle", label: "Bundle", coins: 25_000, pricePaise: 25_000 },
];

export const shopPaths = [
  { title: "Earn coins", body: "Play Fun mode games and claim studio coins." },
  { title: "Buy coin packs", body: "Purchase coin packages with real money." },
  { title: "Redeem coins", body: "Spend coins on digital products in the marketplace." },
  { title: "Pay with money", body: "Buy the same products directly with rupees." },
] as const;

export function packPriceLabel(pack: CoinPack) {
  return formatSkillPrice(pack.pricePaise);
}

export function packCoinsLabel(pack: CoinPack) {
  return formatCoins(pack.coins);
}

export function packMatchesShopRate(pack: CoinPack) {
  return pack.coins === priceInCoins(pack.pricePaise) && pack.coins === (pack.pricePaise * COINS_PER_RUPEE) / 100;
}
