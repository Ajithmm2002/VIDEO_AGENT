import type { Metadata } from "next";
import { FunMode } from "@/components/fun-mode";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Fun mode" };

export default function PlayPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Play"
        title="Fun mode"
        description="A short break between drafts. Memory reels and a timing catch — nothing is saved, and nothing is sold here."
      />
      <FunMode />
    </div>
  );
}
