import type { Metadata } from "next";
import { FunMode } from "@/components/fun-mode";
import { PageHeader } from "@/components/ui";
import { getGameWallet } from "@/lib/queries";

export const metadata: Metadata = { title: "Fun mode" };

export default async function PlayPage() {
  const wallet = await getGameWallet();
  return (
    <div>
      <PageHeader
        eyebrow="Play"
        title="Fun mode"
        description="Earn studio coins by playing, or buy coin packs with money. Spend coins in the marketplace. Coins are not transferable and have no cash value."
      />
      <FunMode coins={wallet.coins} earned={wallet.earned} />
    </div>
  );
}
