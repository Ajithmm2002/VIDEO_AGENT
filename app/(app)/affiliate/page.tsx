import type { Metadata } from "next";
import { AffiliateStudio } from "@/components/affiliate-studio";
import { PageHeader } from "@/components/ui";
import { isSupabaseConfigured, remoteAiEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Affiliate ads" };

export default function AffiliatePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Sell"
        title="Affiliate ads"
        description="A separate workspace for clothing, jewellery, shoes, and electronics. Paste a product link, then get a caption, hashtags, and professional image and video prompts."
      />
      <AffiliateStudio configured={isSupabaseConfigured()} aiConnected={remoteAiEnabled()} />
    </div>
  );
}
