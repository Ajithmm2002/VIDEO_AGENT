import type { Metadata } from "next";
import { InstallAppCard } from "@/components/pwa";
import { SettingsManager } from "@/components/settings-manager";
import { CalendarSyncCard, CsvImportCard } from "@/components/settings-extras";
import { PageHeader } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { getCreatorSettings, getGameWallet, getProfile, listCategories } from "@/lib/queries";
import { requestOrigin } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const configured = isSupabaseConfigured();
  const [profile, categories, wallet, creator, origin] = await Promise.all([
    getProfile(),
    listCategories(),
    configured ? getGameWallet() : Promise.resolve({ coins: 0, earned: 0 }),
    getCreatorSettings(),
    requestOrigin(),
  ]);
  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Calendar sync, import and export, backups, categories, and installing the app. Your name and email are on Profile."
      />
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <CalendarSyncCard token={creator.settings?.calendar_token ?? null} origin={origin} configured={configured} missing={creator.missing} />
        <InstallAppCard />
        <CsvImportCard configured={configured} />
      </div>
      <SettingsManager profile={profile} categories={categories} configured={configured} wallet={wallet} />
    </div>
  );
}
