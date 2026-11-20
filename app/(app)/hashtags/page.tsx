import type { Metadata } from "next";
import { HashtagManager } from "@/components/hashtag-manager";
import { PageHeader } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { listCollections } from "@/lib/queries";

export const metadata: Metadata = { title: "Hashtags" };

export default async function HashtagsPage() {
  const collections = await listCollections();
  return (
    <div>
      <PageHeader eyebrow="Reuse" title="Hashtags" description="Save collections you can drop onto any content item." />
      <HashtagManager collections={collections} configured={isSupabaseConfigured()} />
    </div>
  );
}
