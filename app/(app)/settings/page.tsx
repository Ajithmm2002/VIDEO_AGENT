import type { Metadata } from "next";
import { SettingsManager } from "@/components/settings-manager";
import { PageHeader } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { getProfile, listCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [profile, categories] = await Promise.all([getProfile(), listCategories()]);
  return (
    <div>
      <PageHeader eyebrow="Account" title="Settings" description="Your name, categories, CSV export, and a JSON backup you can restore later." />
      <SettingsManager profile={profile} categories={categories} configured={isSupabaseConfigured()} />
    </div>
  );
}
