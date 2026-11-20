"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { applyWriting, createFromWriting, generateWriting } from "@/lib/actions/generate";
import { CopyButton } from "@/components/copy-button";
import { Button, Card, CountSelect, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { languageLabels, platformLabels } from "@/lib/labels";
import type { ContentInput, ContentOption, Language, Platform } from "@/lib/types";
import { languages, platforms } from "@/lib/types";
import { defaultChecklist } from "@/lib/utils";

export function WritingStudio({
  configured,
  contents,
  initial,
  aiConnected,
}: {
  configured: boolean;
  contents: ContentOption[];
  initial: { topic: string; language: Language; platform: Platform; contentId: string };
  aiConnected: boolean;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState(initial.topic);
  const [language, setLanguage] = useState<Language>(initial.language);
  const [platform, setPlatform] = useState<Platform>(initial.platform);
  const [tone, setTone] = useState("");
  const [contentId, setContentId] = useState(initial.contentId);
  const [tagCount, setTagCount] = useState(12);
  const [hashtagCount, setHashtagCount] = useState(15);
  const [pending, setPending] = useState(false);
  const [provider, setProvider] = useState<"local" | "remote" | null>(null);
  const [titles, setTitles] = useState<string[]>(["", "", ""]);
  const [youtubeDescription, setYoutubeDescription] = useState("");
  const [instagramCaption, setInstagramCaption] = useState("");
  const [tags, setTags] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [hook, setHook] = useState("");
  const [scriptOutline, setScriptOutline] = useState("");

  async function onGenerate() {
    setPending(true);
    try {
      const result = await generateWriting({ topic, language, platform, tone, tagCount, hashtagCount });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const draft = result.result;
      setProvider(draft.provider);
      setTitles([draft.titles[0] ?? "", draft.titles[1] ?? "", draft.titles[2] ?? ""]);
      setYoutubeDescription(draft.youtubeDescription);
      setInstagramCaption(draft.instagramCaption);
      setTags(draft.tags.join(", "));
      setHashtags(draft.hashtags.join(" "));
      setHook(draft.hook);
      setScriptOutline(draft.scriptOutline);
    } finally {
      setPending(false);
    }
  }

  function payload(): ContentInput {
    return {
      title: titles[0] || topic,
      topic,
      platform,
      language,
      status: "idea",
      category_id: null,
      description: youtubeDescription,
      youtube_description: youtubeDescription,
      instagram_caption: instagramCaption,
      tags: tags.split(",").map((item) => item.trim()).filter(Boolean),
      hashtags: hashtags.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean),
      script_notes: [hook, scriptOutline].filter(Boolean).join("\n\n"),
      thumbnail_prompt: null,
      video_url: null,
      published_url: null,
      planned_date: null,
      views: null,
      likes: null,
      comments: null,
      notes: null,
      reference_links: [],
      checklist: defaultChecklist(),
      is_template: false,
    };
  }

  return (
    <div className="grid gap-4">
      <Card className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-muted">
            {provider === "remote"
              ? "Generated with Gemini. Every field stays editable."
              : aiConnected
                ? "Gemini is connected. If a request is busy, a local draft is used instead."
                : "Template generator. Add AI_PROVIDER=gemini and AI_API_KEY on the host to use Gemini."}
          </p>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${provider === "remote" ? "bg-accent/12 text-accent" : "bg-surface-2 text-muted"}`}>
            {provider === "remote" ? "Gemini" : "Local templates"}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Topic">
            <TextInput value={topic} onChange={(event) => setTopic(event.target.value)} />
          </Field>
          <Field label="Tone" hint="Optional.">
            <TextInput value={tone} onChange={(event) => setTone(event.target.value)} />
          </Field>
          <Field label="Language">
            <SelectInput value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
              {languages.map((item) => <option key={item} value={item}>{languageLabels[item]}</option>)}
            </SelectInput>
          </Field>
          <Field label="Platform">
            <SelectInput value={platform} onChange={(event) => setPlatform(event.target.value as Platform)}>
              {platforms.map((item) => <option key={item} value={item}>{platformLabels[item]}</option>)}
            </SelectInput>
          </Field>
          <CountSelect label="Number of YouTube tags" value={tagCount} onChange={setTagCount} />
          <CountSelect label="Number of hashtags" value={hashtagCount} onChange={setHashtagCount} />
        </div>
        <Button className="w-fit" onClick={onGenerate} disabled={pending}>
          {pending ? "Writing…" : "Generate draft"}
        </Button>
      </Card>

      <Card className="grid gap-3">
        <h2 className="font-semibold">Titles</h2>
        {titles.map((title, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <TextInput className="min-w-0 flex-1" value={title} aria-label={`Title ${index + 1}`} onChange={(event) => {
              const next = [...titles];
              next[index] = event.target.value;
              setTitles(next);
            }} />
            <CopyButton text={title} />
          </div>
        ))}
      </Card>

      <DraftField label="Hook" value={hook} onChange={setHook} />
      <DraftField label="YouTube description" value={youtubeDescription} onChange={setYoutubeDescription} />
      <DraftField label="Instagram caption" value={instagramCaption} onChange={setInstagramCaption} />
      <DraftField label="YouTube tags" value={tags} onChange={setTags} />
      <DraftField label="Hashtags" value={hashtags} onChange={setHashtags} />
      <DraftField label="Script outline" value={scriptOutline} onChange={setScriptOutline} tall />

      <Card className="flex flex-wrap items-end gap-2">
        <Field label="Apply to existing content">
          <SelectInput value={contentId} onChange={(event) => setContentId(event.target.value)} disabled={!configured}>
            <option value="">Choose content</option>
            {contents.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </SelectInput>
        </Field>
        <Button
          variant="secondary"
          disabled={!configured}
          onClick={async () => {
            if (!contentId) {
              toast.error("Choose a content item.");
              return;
            }
            const result = await applyWriting(contentId, {
              title: titles[0] || undefined,
              youtube_description: youtubeDescription,
              instagram_caption: instagramCaption,
              description: youtubeDescription,
              tags: tags.split(",").map((item) => item.trim()).filter(Boolean),
              hashtags: hashtags.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean),
              script_notes: [hook, scriptOutline].filter(Boolean).join("\n\n"),
            });
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Draft applied");
            router.push(`/content/${contentId}`);
          }}
        >
          Update content
        </Button>
        <Button
          disabled={!configured}
          onClick={async () => {
            const result = await createFromWriting(payload());
            if (!result.ok || !result.id) {
              toast.error(result.ok ? "Could not create content." : result.error);
              return;
            }
            toast.success("Content created");
            router.push(`/content/${result.id}`);
          }}
        >
          Save as new content
        </Button>
      </Card>
    </div>
  );
}

function DraftField({
  label,
  value,
  onChange,
  tall,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tall?: boolean;
}) {
  return (
    <Card className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{label}</h2>
        <CopyButton text={value} />
      </div>
      <TextArea className={tall ? "min-h-56" : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
    </Card>
  );
}
