"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteContent, duplicateContent, saveAsTemplate, saveContent, setThumbnailPath } from "@/lib/actions/content";
import { onGenerationResult, startTopicGeneration, useGenerationJobs } from "@/lib/background-generate";
import { ConfirmButton } from "@/components/confirm-button";
import { CopyField } from "@/components/copy-button";
import { Button, Card, CountSelect, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { languageLabels, platformLabels, statusLabels } from "@/lib/labels";
import type { Category, Content, ContentInput, HashtagCollection } from "@/lib/types";
import { languages, platforms, statuses } from "@/lib/types";
import { defaultChecklist, newId, safeFileName } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { clearDraft, readDraft, writeDraft } from "@/lib/draft";

function splitTags(value: string) {
  return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

function splitHashtags(value: string) {
  return value.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
}

function toInput(content?: Content): ContentInput {
  if (!content) {
    return {
      title: "",
      topic: null,
      platform: "both",
      language: "en",
      status: "idea",
      category_id: null,
      description: null,
      youtube_description: null,
      instagram_caption: null,
      tags: [],
      hashtags: [],
      script_notes: null,
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
  return {
    title: content.title,
    topic: content.topic,
    platform: content.platform,
    language: content.language,
    status: content.status,
    category_id: content.category_id,
    description: content.description,
    youtube_description: content.youtube_description,
    instagram_caption: content.instagram_caption,
    tags: content.tags,
    hashtags: content.hashtags,
    script_notes: content.script_notes,
    thumbnail_prompt: content.thumbnail_prompt,
    video_url: content.video_url,
    published_url: content.published_url,
    planned_date: content.planned_date,
    views: content.views,
    likes: content.likes,
    comments: content.comments,
    notes: content.notes,
    reference_links: content.reference_links,
    checklist: content.checklist.length ? content.checklist : defaultChecklist(),
    is_template: content.is_template,
  };
}

function integerOrNull(value: string) {
  if (!value.trim()) return null;
  if (!/^\d+$/.test(value.trim())) return Number.NaN;
  return Number(value.trim());
}

export function ContentForm({
  content,
  categories,
  collections,
  thumbnailUrl,
  configured,
  aiConnected,
}: {
  content?: Content;
  categories: Category[];
  collections: HashtagCollection[];
  thumbnailUrl: string | null;
  configured: boolean;
  aiConnected: boolean;
}) {
  const router = useRouter();
  const jobs = useGenerationJobs();
  const generating = jobs.topic.pending;
  const initial = toInput(content);
  const [form, setForm] = useState(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [hashText, setHashText] = useState(initial.hashtags.join(" "));
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState<"duplicate" | "template" | null>(null);
  const [collectionId, setCollectionId] = useState("");
  const [tagCount, setTagCount] = useState(12);
  const [hashtagCount, setHashtagCount] = useState(15);
  const [generator, setGenerator] = useState<"local" | "remote" | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const draftKey = content?.id ? `content-draft:${content.id}` : "content-draft:new";

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- restore unsaved work after switching pages */
    const stored = readDraft<{
      form: ContentInput;
      tagsText: string;
      hashText: string;
      tagCount: number;
      hashtagCount: number;
      generator: "local" | "remote" | null;
    }>(draftKey);
    if (stored?.form) {
      setForm(stored.form);
      setTagsText(stored.tagsText ?? stored.form.tags.join(", "));
      setHashText(stored.hashText ?? stored.form.hashtags.join(" "));
      if (stored.tagCount) setTagCount(stored.tagCount);
      if (stored.hashtagCount) setHashtagCount(stored.hashtagCount);
      setGenerator(stored.generator ?? null);
    }
    setDraftReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [draftKey]);

  useEffect(() => {
    return onGenerationResult<{
      description: string;
      youtubeDescription: string;
      instagramCaption: string;
      tags: string[];
      hashtags: string[];
      provider: "local" | "remote";
      draftKey: string;
    }>("topic", (draft) => {
      if (draft.draftKey !== draftKey) return;
      setGenerator(draft.provider);
      patch({
        description: draft.description,
        youtube_description: draft.youtubeDescription,
        instagram_caption: draft.instagramCaption,
        tags: draft.tags,
        hashtags: draft.hashtags,
      });
      setTagsText(draft.tags.join(", "));
      setHashText(draft.hashtags.join(" "));
    });
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady || generating) return;
    writeDraft(draftKey, { form, tagsText, hashText, tagCount, hashtagCount, generator });
  }, [draftKey, draftReady, form, tagsText, hashText, tagCount, hashtagCount, generator, generating]);

  function patch(partial: Partial<ContentInput>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function onGenerateCopy() {
    const topic = (form.topic ?? form.title).trim();
    if (!topic) {
      toast.error("Enter a topic or title first.");
      return;
    }
    startTopicGeneration({
      draftKey,
      topic,
      title: form.title,
      notes: [form.script_notes, form.description].filter(Boolean).join("\n\n"),
      language: form.language,
      platform: form.platform,
      tagCount,
      hashtagCount,
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const views = integerOrNull(String(form.views ?? ""));
    const likes = integerOrNull(String(form.likes ?? ""));
    const comments = integerOrNull(String(form.comments ?? ""));
    if ([views, likes, comments].some((value) => Number.isNaN(value))) {
      toast.error("Views, likes, and comments must be whole numbers.");
      return;
    }
    const payload: ContentInput = {
      ...form,
      title: form.title,
      tags: splitTags(tagsText),
      hashtags: splitHashtags(hashText),
      views,
      likes,
      comments,
      checklist: form.checklist.filter((item) => item.label.trim()),
      reference_links: form.reference_links.filter(
        (link) => link.title.trim() && link.url.trim() && link.url.trim() !== "https://",
      ),
    };
    setPending(true);
    const result = await saveContent(content?.id ?? null, payload);
    if (!result.ok || !result.id) {
      setPending(false);
      toast.error(result.ok ? "Could not save this content." : result.error);
      return;
    }
    if (file) {
      try {
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
          throw new Error("Use a JPEG, PNG, WebP, or GIF under 5 MB.");
        }
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Sign in to upload a thumbnail.");
        const path = `${userData.user.id}/${result.id}/${newId()}-${safeFileName(file.name)}`;
        const uploaded = await supabase.storage.from("thumbnails").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (uploaded.error) throw new Error("Could not upload the thumbnail.");
        const saved = await setThumbnailPath(result.id, path);
        if (!saved.ok) throw new Error(saved.error);
      } catch (error) {
        setPending(false);
        toast.error(error instanceof Error ? error.message : "Could not upload the thumbnail.");
        router.push(`/content/${result.id}`);
        return;
      }
    }
    setPending(false);
    clearDraft(draftKey);
    if (!content?.id) clearDraft("content-draft:new");
    toast.success(result.message ?? "Saved");
    router.push(`/content/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Card className="grid gap-4 md:grid-cols-2">
        <CopyField label="Title" text={form.title}>
          <TextInput value={form.title} onChange={(event) => patch({ title: event.target.value })} required maxLength={200} />
        </CopyField>
        <CopyField label="Topic or idea" text={form.topic ?? ""}>
          <TextInput value={form.topic ?? ""} onChange={(event) => patch({ topic: event.target.value || null })} maxLength={500} />
        </CopyField>
        <Field label="Platform">
          <SelectInput value={form.platform} onChange={(event) => patch({ platform: event.target.value as ContentInput["platform"] })}>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>{platformLabels[platform]}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Language">
          <SelectInput value={form.language} onChange={(event) => patch({ language: event.target.value as ContentInput["language"] })}>
            {languages.map((language) => (
              <option key={language} value={language}>{languageLabels[language]}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Status">
          <SelectInput value={form.status} onChange={(event) => patch({ status: event.target.value as ContentInput["status"] })}>
            {statuses.map((status) => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Category">
          <SelectInput value={form.category_id ?? ""} onChange={(event) => patch({ category_id: event.target.value || null })}>
            <option value="">None</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Planned publishing date">
          <TextInput type="date" value={form.planned_date ?? ""} onChange={(event) => patch({ planned_date: event.target.value || null })} />
        </Field>
        <label className="flex items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={form.is_template}
            onChange={(event) => patch({ is_template: event.target.checked })}
          />
          Save this item as a template
        </label>
      </Card>

      <Card className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Generate from topic</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Reads the title, topic, and notes, then fills a description with emojis plus English YouTube tags and hashtags.
              Change the counts, then edit anything before saving.
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${generator === "remote" ? "bg-accent/12 text-accent" : "bg-surface-2 text-muted"}`}>
            {generator === "remote" ? "Gemini" : aiConnected ? "Gemini when available" : "Local templates"}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <CountSelect label="Number of YouTube tags" value={tagCount} onChange={setTagCount} />
          <CountSelect label="Number of hashtags" value={hashtagCount} onChange={setHashtagCount} />
        </div>
        <Button onClick={onGenerateCopy} loading={generating} disabled={pending || busy !== null}>
          {generating ? "Writing…" : "Generate description and tags"}
        </Button>
      </Card>

      <Card className="grid gap-4">
        <CopyField label="Content description" text={form.description ?? ""}>
          <TextArea value={form.description ?? ""} onChange={(event) => patch({ description: event.target.value || null })} />
        </CopyField>
        <CopyField label="YouTube description" text={form.youtube_description ?? ""}>
          <TextArea value={form.youtube_description ?? ""} onChange={(event) => patch({ youtube_description: event.target.value || null })} />
        </CopyField>
        <CopyField label="Instagram caption" text={form.instagram_caption ?? ""}>
          <TextArea value={form.instagram_caption ?? ""} onChange={(event) => patch({ instagram_caption: event.target.value || null })} />
        </CopyField>
      </Card>

      <Card className="grid gap-4 md:grid-cols-2">
        <CopyField label="YouTube tags" hint="Separate tags with commas. These are SEO tags, not hashtags." text={tagsText}>
          <TextArea value={tagsText} onChange={(event) => setTagsText(event.target.value)} />
        </CopyField>
        <CopyField label="Hashtags" hint="Spaces, commas, or new lines. A hash is added if you leave it off." text={hashText}>
          <TextArea value={hashText} onChange={(event) => setHashText(event.target.value)} />
        </CopyField>
        {collections.length ? (
          <div className="flex flex-wrap items-end gap-2 md:col-span-2">
            <Field label="Add a hashtag collection">
              <SelectInput value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>
                <option value="">Choose a collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>{collection.name}</option>
                ))}
              </SelectInput>
            </Field>
            <Button
              variant="secondary"
              onClick={() => {
                const collection = collections.find((item) => item.id === collectionId);
                if (!collection) return;
                setHashText((current) => [current, collection.hashtags.join(" ")].filter(Boolean).join(" "));
              }}
            >
              Add hashtags
            </Button>
          </div>
        ) : null}
      </Card>

      <Card className="grid gap-4">
        <CopyField label="Video script or notes" text={form.script_notes ?? ""}>
          <TextArea className="min-h-40" value={form.script_notes ?? ""} onChange={(event) => patch({ script_notes: event.target.value || null })} />
        </CopyField>
        <CopyField label="Thumbnail prompt" hint="Paste a prompt from the thumbnail studio, or write your own." text={form.thumbnail_prompt ?? ""}>
          <TextArea value={form.thumbnail_prompt ?? ""} onChange={(event) => patch({ thumbnail_prompt: event.target.value || null })} />
        </CopyField>
        {content ? (
          <div className="flex flex-wrap gap-2 text-sm">
            <Button variant="ghost" onClick={() => router.push(`/thumbnails?content=${content.id}&topic=${encodeURIComponent(form.topic ?? form.title)}&language=${form.language}`)}>
              Open thumbnail studio
            </Button>
            <Button variant="ghost" onClick={() => router.push(`/assistant?content=${content.id}&topic=${encodeURIComponent(form.topic ?? form.title)}&language=${form.language}&platform=${form.platform}`)}>
              Open writing assistant
            </Button>
          </div>
        ) : null}
      </Card>

      <Card className="grid gap-4 md:grid-cols-2">
        <CopyField label="Video URL" text={form.video_url ?? ""}>
          <TextInput type="url" placeholder="https://" value={form.video_url ?? ""} onChange={(event) => patch({ video_url: event.target.value || null })} />
        </CopyField>
        <CopyField label="Published post URL" text={form.published_url ?? ""}>
          <TextInput type="url" placeholder="https://" value={form.published_url ?? ""} onChange={(event) => patch({ published_url: event.target.value || null })} />
        </CopyField>
        <Field label="Thumbnail image" hint="JPEG, PNG, WebP, or GIF. 5 MB maximum. Saved when you save the content.">
          <TextInput
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            disabled={!configured}
          />
        </Field>
        {thumbnailUrl ? (
          <div>
            {/* Signed Supabase URLs expire, so the image optimizer cannot cache them. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnailUrl} alt={`${form.title || "Content"} thumbnail preview`} className="max-h-40 rounded-xl border border-line object-cover" />
            {content ? (
              <div className="mt-2">
                <ConfirmButton
                  label="Remove image"
                  title="Remove thumbnail?"
                  message="The image file will be deleted from your account."
                  confirmLabel="Remove"
                  onConfirm={async () => {
                    const result = await setThumbnailPath(content.id, null);
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    toast.success("Thumbnail removed");
                    router.refresh();
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">Checklist</h2>
        <div className="grid gap-2">
          {form.checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.done}
                aria-label={`Mark ${item.label} done`}
                onChange={(event) =>
                  patch({
                    checklist: form.checklist.map((entry) =>
                      entry.id === item.id ? { ...entry, done: event.target.checked } : entry,
                    ),
                  })
                }
              />
              <TextInput
                value={item.label}
                aria-label="Checklist item"
                onChange={(event) =>
                  patch({
                    checklist: form.checklist.map((entry) =>
                      entry.id === item.id ? { ...entry, label: event.target.value } : entry,
                    ),
                  })
                }
              />
              <Button
                variant="ghost"
                onClick={() => patch({ checklist: form.checklist.filter((entry) => entry.id !== item.id) })}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            className="w-fit"
            onClick={() => patch({ checklist: [...form.checklist, { id: newId(), label: "New step", done: false }] })}
          >
            Add step
          </Button>
        </div>
      </Card>

      <Card className="grid gap-4 md:grid-cols-3">
        <Field label="Views">
          <TextInput inputMode="numeric" value={form.views ?? ""} onChange={(event) => patch({ views: event.target.value ? Number(event.target.value) : null })} />
        </Field>
        <Field label="Likes">
          <TextInput inputMode="numeric" value={form.likes ?? ""} onChange={(event) => patch({ likes: event.target.value ? Number(event.target.value) : null })} />
        </Field>
        <Field label="Comments">
          <TextInput inputMode="numeric" value={form.comments ?? ""} onChange={(event) => patch({ comments: event.target.value ? Number(event.target.value) : null })} />
        </Field>
      </Card>

      <Card className="grid gap-4">
        <CopyField label="Notes" text={form.notes ?? ""}>
          <TextArea value={form.notes ?? ""} onChange={(event) => patch({ notes: event.target.value || null })} />
        </CopyField>
        <div className="grid gap-2">
          <h2 className="font-semibold">Reference links</h2>
          {form.reference_links.map((link) => (
            <div key={link.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <TextInput
                aria-label="Link title"
                value={link.title}
                onChange={(event) =>
                  patch({
                    reference_links: form.reference_links.map((entry) =>
                      entry.id === link.id ? { ...entry, title: event.target.value } : entry,
                    ),
                  })
                }
              />
              <TextInput
                aria-label="Link URL"
                type="url"
                placeholder="https://"
                value={link.url}
                onChange={(event) =>
                  patch({
                    reference_links: form.reference_links.map((entry) =>
                      entry.id === link.id ? { ...entry, url: event.target.value } : entry,
                    ),
                  })
                }
              />
              <Button
                variant="ghost"
                onClick={() => patch({ reference_links: form.reference_links.filter((entry) => entry.id !== link.id) })}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            className="w-fit"
            onClick={() =>
              patch({
                reference_links: [...form.reference_links, { id: newId(), title: "", url: "https://" }],
              })
            }
          >
            Add link
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending} disabled={!configured || generating || busy !== null}>
          {pending ? "Saving…" : "Save content"}
        </Button>
        {content ? (
          <>
            <Button
              variant="secondary"
              loading={busy === "duplicate"}
              disabled={pending || generating || busy === "template"}
              onClick={async () => {
                setBusy("duplicate");
                try {
                  const result = await duplicateContent(content.id);
                  if (!result.ok || !result.id) {
                    toast.error(result.ok ? "Could not duplicate." : result.error);
                    return;
                  }
                  toast.success("Copy created");
                  router.push(`/content/${result.id}`);
                } finally {
                  setBusy(null);
                }
              }}
            >
              {busy === "duplicate" ? "Duplicating…" : "Duplicate"}
            </Button>
            <Button
              variant="secondary"
              loading={busy === "template"}
              disabled={pending || generating || busy === "duplicate"}
              onClick={async () => {
                setBusy("template");
                try {
                  const result = await saveAsTemplate(content.id);
                  if (!result.ok || !result.id) {
                    toast.error(result.ok ? "Could not save a template." : result.error);
                    return;
                  }
                  toast.success("Template saved");
                  router.push(`/content/${result.id}`);
                } finally {
                  setBusy(null);
                }
              }}
            >
              {busy === "template" ? "Saving template…" : "Save as template"}
            </Button>
            <ConfirmButton
              label="Delete"
              title="Delete this content?"
              message="This removes the content item and its thumbnail file. Saved prompts stay in your account."
              confirmLabel="Delete"
              pendingLabel="Deleting…"
              disabled={pending || generating || busy !== null}
              onConfirm={async () => {
                const result = await deleteContent(content.id);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Content deleted");
                router.push("/content");
                router.refresh();
              }}
            />
          </>
        ) : null}
      </div>
      {configured ? null : <p className="text-sm text-muted">Connect Supabase before saving. Your typing stays in this form until you leave the page.</p>}
    </form>
  );
}
