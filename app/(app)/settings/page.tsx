import type { Metadata } from "next";
import { SettingsManager } from "@/components/settings-manager";
import { PageHeader } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { getGameWallet, getProfile, listCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const configured = isSupabaseConfigured();
  const [profile, categories, wallet] = await Promise.all([
    getProfile(),
    listCategories(),
    configured ? getGameWallet() : Promise.resolve({ coins: 0, earned: 0 }),
  ]);
  return (
    <div>
      <PageHeader eyebrow="Account" title="Settings" description="Categories, CSV export, and a JSON backup. Your name and email are on Profile." />
      <SettingsManager profile={profile} categories={categories} configured={configured} wallet={wallet} />
    </div>
  );
}
