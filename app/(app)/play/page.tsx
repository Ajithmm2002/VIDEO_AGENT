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
        description="Play to earn coins. 100 coins = ₹1. A good run pays up to 12 coins, 400 a day. Use Buy now in the shop when Razorpay is ready."
      />
      <FunMode coins={wallet.coins} earned={wallet.earned} />
    </div>
  );
}
