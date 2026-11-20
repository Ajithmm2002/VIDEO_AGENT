"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { generateThumbnails, savePrompt } from "@/lib/actions/generate";
import { CopyButton } from "@/components/copy-button";
import { Button, Card, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { googleFlowUrl, languageLabels } from "@/lib/labels";
import type { ContentOption, Language } from "@/lib/types";
import { languages } from "@/lib/types";
import { clearDraft, readDraft, writeDraft } from "@/lib/draft";

export function ThumbnailStudio({
  configured,
  contents,
  initial,
}: {
  configured: boolean;
  contents: ContentOption[];
  initial: { topic: string; language: Language; contentId: string };
}) {
  const router = useRouter();
  const [topic, setTopic] = useState(initial.topic);
  const [language, setLanguage] = useState<Language>(initial.language);
  const [styleNotes, setStyleNotes] = useState("");
  const [landscape, setLandscape] = useState("");
  const [vertical, setVertical] = useState("");
  const [provider, setProvider] = useState<"local" | "remote" | null>(null);
  const [contentId, setContentId] = useState(initial.contentId);
  const [pending, setPending] = useState(false);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- restore unsaved work after switching pages */
    const stored = readDraft<{
      topic: string;
      language: Language;
      styleNotes: string;
      landscape: string;
      vertical: string;
      provider: "local" | "remote" | null;
      contentId: string;
    }>("thumbnail-draft");
    if (stored) {
      if (!initial.topic) setTopic(stored.topic);
      if (!initial.topic) setLanguage(stored.language);
      setStyleNotes(stored.styleNotes ?? "");
      setLandscape(stored.landscape ?? "");
      setVertical(stored.vertical ?? "");
      setProvider(stored.provider ?? null);
      if (!initial.contentId && stored.contentId) setContentId(stored.contentId);
    }
    setDraftReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initial.contentId, initial.topic]);

  useEffect(() => {
    if (!draftReady) return;
    writeDraft("thumbnail-draft", { topic, language, styleNotes, landscape, vertical, provider, contentId });
  }, [draftReady, topic, language, styleNotes, landscape, vertical, provider, contentId]);

  async function onGenerate() {
    setPending(true);
    const result = await generateThumbnails({ topic, language, styleNotes });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setLandscape(result.result.landscape);
    setVertical(result.result.vertical);
    setProvider(result.result.provider);
    if (result.result.language !== language) setLanguage(result.result.language);
  }

  async function onSave() {
    const result = await savePrompt({ topic, language, landscape, vertical, contentId: contentId || null });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(contentId ? "Prompt saved on the content item" : "Prompt saved");
    clearDraft("thumbnail-draft");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <Card className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-muted">
            {provider === "remote"
              ? "Generated with your connected AI provider. Edit anything before you copy it."
              : "Template generator. No paid API is required. Edit the prompt, then paste it into Google Flow."}
          </p>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${provider === "remote" ? "bg-accent/12 text-accent" : "bg-surface-2 text-muted"}`}>
            {provider === "remote" ? "Gemini" : "Local templates"}
          </span>
        </div>
        <Field label="Topic" hint="Malayalam or English. Malayalam topics are quoted as the text on the thumbnail.">
          <TextInput value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={500} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Language">
            <SelectInput value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
              {languages.map((item) => (
                <option key={item} value={item}>{languageLabels[item]}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Style notes" hint="Optional. Example: flat illustration, warm kitchen light.">
            <TextInput value={styleNotes} onChange={(event) => setStyleNotes(event.target.value)} maxLength={500} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onGenerate} disabled={pending}>{pending ? "Writing prompt…" : "Generate prompts"}</Button>
          <a
            href={googleFlowUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold"
          >
            Open Google Flow <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="grid gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Landscape 16:9</h2>
            <CopyButton text={landscape} />
          </div>
          <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_20%_20%,rgb(var(--glow)/0.22),transparent_45%),radial-gradient(circle_at_80%_80%,rgb(var(--glow-warm)/0.2),transparent_40%),var(--surface-2)]" />
          <TextArea className="min-h-80" value={landscape} onChange={(event) => setLandscape(event.target.value)} />
        </Card>
        <Card className="grid gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Vertical 9:16</h2>
            <CopyButton text={vertical} />
          </div>
          <div className="mx-auto h-40 w-24 overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_30%_20%,rgb(var(--glow-warm)/0.28),transparent_42%),radial-gradient(circle_at_70%_80%,rgb(var(--glow)/0.22),transparent_40%),var(--surface-2)]" />
          <TextArea className="min-h-80" value={vertical} onChange={(event) => setVertical(event.target.value)} />
        </Card>
      </div>

      <Card className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <Field label="Save with content" hint={configured ? "Optional. Leave this empty to keep the prompt in your library only." : "Connect Supabase to save prompts."}>
          <SelectInput value={contentId} onChange={(event) => setContentId(event.target.value)} disabled={!configured}>
            <option value="">Do not attach</option>
            {contents.map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </SelectInput>
        </Field>
        <Button onClick={onSave} disabled={!configured}>Save prompt</Button>
      </Card>
      <p className="text-sm text-muted">
        This app does not generate images. Copy a prompt and open <Link className="underline" href={googleFlowUrl} target="_blank">Google Flow</Link>.
      </p>
    </div>
  );
}
