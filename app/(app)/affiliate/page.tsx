import type { Metadata } from "next";
import { AffiliateStudio } from "@/components/affiliate-studio";
import { PageHeader } from "@/components/ui";
import { isSupabaseConfigured, remoteAiEnabled } from "@/lib/env";
import { getProfile } from "@/lib/queries";
import { requestUserEmail } from "@/lib/session";

export const metadata: Metadata = { title: "Affiliate ads" };

export default async function AffiliatePage() {
  const [profile, email] = await Promise.all([getProfile(), requestUserEmail()]);
  const accountName = profile?.display_name?.trim() || email?.split("@")[0]?.trim() || "";
  return (
    <div>
      <PageHeader
        eyebrow="Sell"
        title="Affiliate ads"
        description="A separate workspace for clothing, jewellery, shoes, and electronics. Paste a product link, then get a caption, hashtags, and professional image and video prompts."
      />
      <AffiliateStudio
        configured={isSupabaseConfigured()}
        aiConnected={remoteAiEnabled()}
        accountName={accountName}
      />
    </div>
  );
}
