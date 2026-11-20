import type { Metadata } from "next";
import { ContentForm } from "@/components/content-form";
import { PageHeader } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { listCategories, listCollections } from "@/lib/queries";

export const metadata: Metadata = { title: "New content" };

export default async function NewContentPage() {
  const [categories, collections] = await Promise.all([listCategories(), listCollections()]);
  return (
    <div>
      <PageHeader eyebrow="Create" title="New content" description="Start with a title. You can fill the script, captions, and thumbnail later." />
      <ContentForm categories={categories} collections={collections} thumbnailUrl={null} configured={isSupabaseConfigured()} />
    </div>
  );
}
