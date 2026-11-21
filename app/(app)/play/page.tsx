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
        description="Play to earn studio coins for this skill shop. Up to 12 coins per run, 400 a day. Coins stay on your account, are not transferable, and have no cash value."
      />
      <FunMode coins={wallet.coins} earned={wallet.earned} />
    </div>
  );
}
