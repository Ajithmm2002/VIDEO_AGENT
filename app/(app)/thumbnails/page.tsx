import type { Metadata } from "next";
import { CopyButton } from "@/components/copy-button";
import { PageHeader } from "@/components/ui";
import { ThumbnailStudio } from "@/components/thumbnail-studio";
import { isSupabaseConfigured } from "@/lib/env";
import { listContentOptions, listPrompts } from "@/lib/queries";
import { languages, type Language } from "@/lib/types";
import { formatDate, visiblePrompt } from "@/lib/utils";

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
  const [prompts, contents] = await Promise.all([listPrompts(), listContentOptions()]);

  return (
    <div>
      <PageHeader
        eyebrow="Visuals"
        title="Thumbnail prompts"
        description="Pick a project title from the dropdown, or type a topic. Copy the landscape and vertical prompts into Google Flow."
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
          {prompts.map((prompt) => {
            const landscape = visiblePrompt(prompt.landscape_prompt);
            const vertical = visiblePrompt(prompt.vertical_prompt);
            return (
              <article key={prompt.id} className="rounded-xl border border-line bg-surface p-4">
                <p className="font-medium">{prompt.topic}</p>
                <p className="text-xs text-muted">{formatDate(prompt.created_at)}</p>
                {landscape ? (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Landscape 16:9</p>
                      <CopyButton text={landscape} />
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{landscape}</p>
                  </div>
                ) : null}
                {vertical ? (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Vertical 9:16</p>
                      <CopyButton text={vertical} />
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{vertical}</p>
                  </div>
                ) : null}
                {landscape || vertical ? null : (
                  <p className="mt-2 text-sm text-muted">No prompt text was stored for this save.</p>
                )}
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
