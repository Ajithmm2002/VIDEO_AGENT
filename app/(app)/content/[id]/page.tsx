import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentForm } from "@/components/content-form";
import { PageHeader } from "@/components/ui";
import { isSupabaseConfigured, remoteAiEnabled } from "@/lib/env";
import { getContent, listCategories, listCollections, signedThumbnailUrl } from "@/lib/queries";
import { requestOrigin } from "@/lib/session";

export const metadata: Metadata = { title: "Edit content" };

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [content, categories, collections, origin] = await Promise.all([
    getContent(id),
    listCategories(),
    listCollections(),
    requestOrigin(),
  ]);
  if (!content) notFound();
  const thumbnailUrl = await signedThumbnailUrl(content.thumbnail_path);

  return (
    <div>
      <PageHeader eyebrow="Edit" title={content.title} description="Update the plan, copy, checklist, and performance numbers." />
      <ContentForm
        key={content.id}
        content={content}
        categories={categories}
        collections={collections}
        thumbnailUrl={thumbnailUrl}
        configured={isSupabaseConfigured()}
        aiConnected={remoteAiEnabled()}
        origin={origin}
      />
    </div>
  );
}
