import type { Metadata } from "next";
import { FunMode } from "@/components/fun-mode";
import { PageHeader } from "@/components/ui";
import { getGameCoins } from "@/lib/queries";

export const metadata: Metadata = { title: "Fun mode" };

export default async function PlayPage() {
  const coins = await getGameCoins();
  return (
    <div>
      <PageHeader
        eyebrow="Play"
        title="Fun mode"
        description="Longer runs earn studio coins. Claim them, then spend 1 coin as ₹1 on skills in the shop. Daily cap is 500 coins."
      />
      <FunMode coins={coins} />
    </div>
  );
}
