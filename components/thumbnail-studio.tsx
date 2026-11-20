"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { savePrompt } from "@/lib/actions/generate";
import { onGenerationResult, startThumbnailGeneration, useGenerationJobs } from "@/lib/background-generate";
import { CopyButton } from "@/components/copy-button";
import { Button, Card, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { googleFlowUrl, languageLabels } from "@/lib/labels";
import type { ContentOption, Language } from "@/lib/types";
import { languages } from "@/lib/types";
import { clearDraft, readDraft, writeDraft } from "@/lib/draft";

type TitleChoice = {
  key: string;
  title: string;
  contentId?: string;
  language?: Language;
  group: "saved" | "planner";
};

function contentTitleKey(id: string) {
  return `content:${id}`;
}

function plannerTitleChoices(): TitleChoice[] {
  const stored = readDraft<{
    items?: Array<{ id?: string; title?: string }>;
  }>("planner-draft");
  const seen = new Set<string>();
  return (stored?.items ?? []).flatMap((item, index) => {
    const title = item.title?.trim() ?? "";
    if (!title) return [];
    const fingerprint = title.toLowerCase();
    if (seen.has(fingerprint)) return [];
    seen.add(fingerprint);
    return [{
      key: `plan:${item.id || String(index)}`,
      title,
      group: "planner" as const,
    }];
  });
}

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
  const jobs = useGenerationJobs();
  const pending = jobs.thumbnail.pending;
  const [topic, setTopic] = useState(initial.topic);
  const [language, setLanguage] = useState<Language>(initial.language);
  const [styleNotes, setStyleNotes] = useState("");
  const [landscape, setLandscape] = useState("");
  const [vertical, setVertical] = useState("");
  const [provider, setProvider] = useState<"local" | "remote" | null>(null);
  const [contentId, setContentId] = useState(initial.contentId);
  const [wantLandscape, setWantLandscape] = useState(true);
  const [wantVertical, setWantVertical] = useState(true);
  const [titleKey, setTitleKey] = useState(initial.contentId ? contentTitleKey(initial.contentId) : "");
  const [plannerChoices, setPlannerChoices] = useState<TitleChoice[]>([]);
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState(false);

  const savedChoices: TitleChoice[] = contents.map((item) => ({
    key: contentTitleKey(item.id),
    title: item.title,
    contentId: item.id,
    language: item.language,
    group: "saved",
  }));
  const savedTitles = new Set(savedChoices.map((item) => item.title.trim().toLowerCase()));
  const planChoices = plannerChoices.filter((item) => !savedTitles.has(item.title.toLowerCase()));
  const titleChoices = [...savedChoices, ...planChoices];
  const selectedTitle = titleChoices.find((item) => item.key === titleKey)?.title ?? "";

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
      wantLandscape?: boolean;
      wantVertical?: boolean;
      titleKey?: string;
    }>("thumbnail-draft");
    setPlannerChoices(plannerTitleChoices());
    if (stored) {
      if (!initial.topic) setTopic(stored.topic);
      if (!initial.topic) setLanguage(stored.language);
      setStyleNotes(stored.styleNotes ?? "");
      setLandscape(stored.landscape ?? "");
      setVertical(stored.vertical ?? "");
      setProvider(stored.provider ?? null);
      if (typeof stored.wantLandscape === "boolean") setWantLandscape(stored.wantLandscape);
      if (typeof stored.wantVertical === "boolean") setWantVertical(stored.wantVertical);
      if (!initial.contentId && stored.contentId) setContentId(stored.contentId);
      if (!initial.contentId && stored.titleKey) setTitleKey(stored.titleKey);
      else if (!initial.contentId && stored.contentId) setTitleKey(contentTitleKey(stored.contentId));
    }
    if (initial.contentId && !initial.topic) {
      const match = contents.find((item) => item.id === initial.contentId);
      if (match) setTopic(match.title);
    }
    setDraftReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [contents, initial.contentId, initial.topic]);

  useEffect(() => {
    return onGenerationResult<{
      landscape: string;
      vertical: string;
      language: Language;
      provider: "local" | "remote";
    }>("thumbnail", (result) => {
      const stored = readDraft<{
        landscape?: string;
        vertical?: string;
        language?: Language;
        provider?: "local" | "remote" | null;
        wantLandscape?: boolean;
        wantVertical?: boolean;
      }>("thumbnail-draft");
      if (stored?.wantLandscape !== false) setLandscape(stored?.landscape ?? result.landscape);
      if (stored?.wantVertical !== false) setVertical(stored?.vertical ?? result.vertical);
      setProvider(result.provider);
      if (result.language) setLanguage(result.language);
    });
  }, []);

  useEffect(() => {
    if (!draftReady || pending) return;
    writeDraft("thumbnail-draft", {
      topic,
      language,
      styleNotes,
      landscape,
      vertical,
      provider,
      contentId,
      wantLandscape,
      wantVertical,
      titleKey,
    });
  }, [draftReady, pending, topic, language, styleNotes, landscape, vertical, provider, contentId, wantLandscape, wantVertical, titleKey]);

  function onPickProjectTitle(key: string) {
    setTitleKey(key);
    if (!key) return;
    const choice = titleChoices.find((item) => item.key === key);
    if (!choice) return;
    setTopic(choice.title);
    if (choice.language) setLanguage(choice.language);
    setContentId(choice.contentId ?? "");
  }

  function onGenerate() {
    if (!wantLandscape && !wantVertical) {
      toast.error("Choose at least one thumbnail format.");
      return;
    }
    const overlay = selectedTitle || topic.trim();
    if (!overlay) {
      toast.error("Choose a project title or enter a topic.");
      return;
    }
    startThumbnailGeneration({
      topic: topic.trim() || overlay,
      title: overlay,
      language,
      styleNotes,
      landscape: wantLandscape,
      vertical: wantVertical,
    });
  }

  async function onSave() {
    setSaving(true);
    try {
      const result = await savePrompt({ topic: selectedTitle || topic, language, landscape, vertical, contentId: contentId || null });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(contentId ? "Prompt saved on the content item" : "Prompt saved");
      clearDraft("thumbnail-draft");
      router.refresh();
    } finally {
      setSaving(false);
    }
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
        <Field
          label="Project title"
          hint={titleChoices.length
            ? "Select a saved or planned title to put that exact text on the thumbnail."
            : "Save a content item or generate a plan first, or type a topic below."}
        >
          <SelectInput value={titleKey} onChange={(event) => onPickProjectTitle(event.target.value)}>
            <option value="">Type a custom topic</option>
            {savedChoices.length ? (
              <optgroup label="Saved projects">
                {savedChoices.map((item) => (
                  <option key={item.key} value={item.key}>{item.title}</option>
                ))}
              </optgroup>
            ) : null}
            {planChoices.length ? (
              <optgroup label="Planner titles">
                {planChoices.map((item) => (
                  <option key={item.key} value={item.key}>{item.title}</option>
                ))}
              </optgroup>
            ) : null}
          </SelectInput>
        </Field>
        {selectedTitle ? (
          <p className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm leading-6">
            On the thumbnail: <span className="font-semibold">{selectedTitle}</span>
          </p>
        ) : null}
        <Field label="Topic" hint="Visual subject. Malayalam or English. If you pick a project title above, that title is the text on the image.">
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
        <div className="grid gap-2">
          <p className="text-sm font-medium">Formats to generate</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={wantLandscape} onChange={(event) => setWantLandscape(event.target.checked)} />
              Landscape 16:9 (YouTube)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={wantVertical} onChange={(event) => setWantVertical(event.target.checked)} />
              Vertical 9:16 (Reels / Shorts)
            </label>
          </div>
          <p className="text-xs leading-5 text-muted">Unchecked formats are left as they are. You can leave this page while a prompt is writing; it keeps going in the background.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onGenerate} loading={pending} disabled={saving || (!wantLandscape && !wantVertical)}>
            {pending ? "Writing prompt…" : wantLandscape && wantVertical ? "Generate both prompts" : wantLandscape ? "Generate 16:9 prompt" : wantVertical ? "Generate 9:16 prompt" : "Generate prompts"}
          </Button>
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
        <Button onClick={onSave} loading={saving} disabled={!configured || pending}>
          {saving ? "Saving…" : "Save prompt"}
        </Button>
      </Card>
      <p className="text-sm text-muted">
        This app does not generate images. Copy a prompt and open <Link className="underline" href={googleFlowUrl} target="_blank">Google Flow</Link>.
      </p>
    </div>
  );
}
