import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { WritingStudio } from "@/components/writing-studio";
import { isSupabaseConfigured } from "@/lib/env";
import { listContentOptions } from "@/lib/queries";
import { languages, platforms, type Language, type Platform } from "@/lib/types";

export const metadata: Metadata = { title: "Writing assistant" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const language = first(params.language);
  const platform = first(params.platform);
  const contents = await listContentOptions();

  return (
    <div>
      <PageHeader
        eyebrow="Words"
        title="Writing assistant"
        description="Draft titles, descriptions, captions, tags, hashtags, a hook, and a script outline. Edit or copy every result."
      />
      <WritingStudio
        configured={isSupabaseConfigured()}
        contents={contents}
        initial={{
          topic: first(params.topic) ?? "",
          language: languages.includes(language as Language) ? (language as Language) : "en",
          platform: platforms.includes(platform as Platform) ? (platform as Platform) : "both",
          contentId: first(params.content) ?? "",
        }}
      />
    </div>
  );
}
