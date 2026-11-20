import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ThumbnailStudio } from "@/components/thumbnail-studio";
import { isSupabaseConfigured } from "@/lib/env";
import { listContentOptions, listPrompts } from "@/lib/queries";
import { languages, type Language } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Thumbnail prompts" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ThumbnailsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const language = first(params.language);
  const prompts = await listPrompts();
  const contents = await listContentOptions();

  return (
    <div>
      <PageHeader
        eyebrow="Visuals"
        title="Thumbnail prompts"
        description="Write a topic in Malayalam or English. Copy the landscape and vertical prompts into Google Flow."
      />
      <ThumbnailStudio
        configured={isSupabaseConfigured()}
        contents={contents}
        initial={{
          topic: first(params.topic) ?? "",
          language: languages.includes(language as Language) ? (language as Language) : "en",
          contentId: first(params.content) ?? "",
        }}
      />
      {prompts.length ? (
        <section className="mt-6 grid gap-3">
          <h2 className="font-semibold">Saved prompts</h2>
          {prompts.map((prompt) => (
            <article key={prompt.id} className="rounded-2xl border border-line bg-surface p-4">
              <p className="font-medium">{prompt.topic}</p>
              <p className="text-xs text-muted">{formatDate(prompt.created_at)}</p>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted">{prompt.landscape_prompt}</p>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
