import type { Metadata } from "next";
import { ProfileSection } from "@/components/profile-section";
import { PageHeader } from "@/components/ui";
import { accountLabel } from "@/lib/account-label";
import { isMarketplaceAdmin, isSupabaseConfigured } from "@/lib/env";
import { getGameWallet, getProfile } from "@/lib/queries";
import { getCurrentUser, requestUserEmail } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const configured = isSupabaseConfigured();
  const [profile, email, wallet, user] = await Promise.all([
    getProfile(),
    configured ? requestUserEmail() : Promise.resolve(null),
    configured ? getGameWallet() : Promise.resolve({ coins: 0, earned: 0 }),
    configured ? getCurrentUser() : Promise.resolve(null),
  ]);
  const name = accountLabel(profile?.display_name, email);

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title={name}
        description="Your email, display name, and studio details. Other people cannot see this page."
      />
      <ProfileSection
        name={name}
        savedName={profile?.display_name?.trim() ?? ""}
        email={email}
        wallet={wallet}
        role={isMarketplaceAdmin(email) ? "Seller desk" : "Customer"}
        joined={user?.created_at ? formatDate(user.created_at) : "This session"}
      />
    </div>
  );
}
