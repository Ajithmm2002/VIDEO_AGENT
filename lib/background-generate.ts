"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { mergeDraft, readDraft, writeDraft } from "@/lib/draft";
import { newId } from "@/lib/utils";
import type { Language, Platform, VideoDuration } from "@/lib/types";

export type GenerationKind = "thumbnail" | "writing" | "topic" | "plan" | "script";

type JobMeta = {
  pending: boolean;
  label: string;
  href: string;
  itemId?: string;
};

const jobs: Record<GenerationKind, JobMeta> = {
  thumbnail: { pending: false, label: "Writing thumbnail prompt…", href: "/thumbnails" },
  writing: { pending: false, label: "Writing draft…", href: "/assistant" },
  topic: { pending: false, label: "Writing description and tags…", href: "/content" },
  plan: { pending: false, label: "Planning ideas…", href: "/planner" },
  script: { pending: false, label: "Writing audio script…", href: "/planner" },
};

const listeners = new Set<() => void>();
const resultListeners: Record<GenerationKind, Set<(payload: unknown) => void>> = {
  thumbnail: new Set(),
  writing: new Set(),
  topic: new Set(),
  plan: new Set(),
  script: new Set(),
};

let snapshotCache = { ...jobs };

function emit() {
  snapshotCache = {
    thumbnail: jobs.thumbnail,
    writing: jobs.writing,
    topic: jobs.topic,
    plan: jobs.plan,
    script: jobs.script,
  };
  for (const listener of listeners) listener();
}

function snapshot() {
  return snapshotCache;
}

export function subscribeGeneration(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useGenerationJobs() {
  return useSyncExternalStore(subscribeGeneration, snapshot, snapshot);
}

export function onGenerationResult<T>(kind: GenerationKind, listener: (payload: T) => void) {
  const set = resultListeners[kind];
  const wrapped = listener as (payload: unknown) => void;
  set.add(wrapped);
  return () => {
    set.delete(wrapped);
  };
}

function postJson(body: unknown): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/generate");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText) as { ok: boolean; result?: unknown; error?: string });
      } catch {
        reject(new Error("Could not read the generator response."));
      }
    };
    xhr.onerror = () => reject(new Error("The generator request was interrupted."));
    xhr.send(JSON.stringify(body));
  });
}

async function runJob(
  kind: GenerationKind,
  body: Record<string, unknown>,
  toastId: string,
  onSuccess: (result: unknown) => void,
  href?: string,
  itemId?: string,
) {
  if (jobs[kind].pending) {
    toast.message("That generator is already running in the background.");
    return;
  }
  jobs[kind] = { ...jobs[kind], pending: true, href: href ?? jobs[kind].href, itemId };
  emit();
  toast.loading(jobs[kind].label, { id: toastId });
  try {
    const response = await postJson({ kind, ...body });
    if (!response.ok) {
      toast.error(response.error ?? "Could not generate.", { id: toastId });
      return;
    }
    onSuccess(response.result);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not generate.", { id: toastId });
  } finally {
    jobs[kind] = { ...jobs[kind], pending: false };
    emit();
  }
}

export function startThumbnailGeneration(input: {
  topic: string;
  language: Language;
  styleNotes?: string;
  landscape?: boolean;
  vertical?: boolean;
  title?: string;
}) {
  void runJob("thumbnail", input, "gen-thumbnail", (result) => {
    if (!result || typeof result !== "object") return;
    const data = result as {
      landscape: string;
      vertical: string;
      language: Language;
      provider: "local" | "remote";
    };
    const current = readDraft<Record<string, unknown>>("thumbnail-draft") ?? {};
    writeDraft("thumbnail-draft", {
      ...current,
      topic: typeof current.topic === "string" && current.topic ? current.topic : input.topic,
      title: input.title ?? current.title ?? "",
      language: data.language,
      styleNotes: input.styleNotes ?? current.styleNotes ?? "",
      landscape: input.landscape !== false ? data.landscape : current.landscape ?? "",
      vertical: input.vertical !== false ? data.vertical : current.vertical ?? "",
      provider: data.provider,
      wantLandscape: input.landscape !== false,
      wantVertical: input.vertical !== false,
    });
    toast.success("Thumbnail prompts ready. You can keep editing them on Thumbnails.", { id: "gen-thumbnail" });
    for (const listener of resultListeners.thumbnail) listener(data);
  });
}

export function startWritingGeneration(input: {
  topic: string;
  language: Language;
  platform: Platform;
  tone?: string;
  tagCount?: number;
  hashtagCount?: number;
  title?: string;
  notes?: string;
}) {
  void runJob("writing", input, "gen-writing", (result) => {
    if (!result || typeof result !== "object") return;
    const data = result as {
      titles: string[];
      youtubeDescription: string;
      instagramCaption: string;
      tags: string[];
      hashtags: string[];
      hook: string;
      scriptOutline: string;
      provider: "local" | "remote";
    };
    mergeDraft("writing-draft", {
      titles: data.titles.length ? data.titles : ["", "", ""],
      youtubeDescription: data.youtubeDescription,
      instagramCaption: data.instagramCaption,
      tags: data.tags.join(", "),
      hashtags: data.hashtags.join(" "),
      hook: data.hook,
      scriptOutline: data.scriptOutline,
      provider: data.provider,
    });
    toast.success("Writing draft ready. Open Writing to edit it.", { id: "gen-writing" });
    for (const listener of resultListeners.writing) listener(data);
  });
}

export function startTopicGeneration(input: {
  draftKey: string;
  topic: string;
  language: Language;
  platform: Platform;
  tagCount: number;
  hashtagCount: number;
  title?: string;
  notes?: string;
}) {
  const { draftKey, ...body } = input;
  void runJob("topic", body, "gen-topic", (result) => {
    if (!result || typeof result !== "object") return;
    const data = result as {
      description: string;
      youtubeDescription: string;
      instagramCaption: string;
      tags: string[];
      hashtags: string[];
      provider: "local" | "remote";
    };
    const current = readDraft<{ form?: Record<string, unknown> }>(draftKey) ?? {};
    writeDraft(draftKey, {
      ...current,
      generator: data.provider,
      tagsText: data.tags.join(", "),
      hashText: data.hashtags.join(" "),
      form: {
        ...(current.form ?? {}),
        description: data.description,
        youtube_description: data.youtubeDescription,
        instagram_caption: data.instagramCaption,
        tags: data.tags,
        hashtags: data.hashtags,
      },
    });
    toast.success("Description and tags ready. Open the content item to edit them.", { id: "gen-topic" });
    for (const listener of resultListeners.topic) listener({ ...data, draftKey });
  }, typeof window !== "undefined" ? window.location.pathname : "/content");
}

export function startPlanGeneration(input: {
  language: Language;
  platform: Platform;
  themes: string[];
  description: string;
  days: number;
  durationSeconds: VideoDuration;
  startDate: string;
}) {
  void runJob("plan", input, "gen-plan", (result) => {
    if (!result || typeof result !== "object") return;
    const data = result as {
      provider: "local" | "remote";
      items: Array<{
        title: string;
        topic: string;
        description: string;
        script: string;
        durationSeconds: VideoDuration;
        planned_date: string;
      }>;
    };
    mergeDraft("planner-draft", {
      provider: data.provider,
      days: input.days,
      durationSeconds: input.durationSeconds,
      items: data.items.map((item) => ({
        id: newId(),
        title: item.title,
        topic: item.topic,
        description: item.description,
        script: "",
        durationSeconds: item.durationSeconds ?? input.durationSeconds,
        planned_date: item.planned_date,
        included: true,
      })),
    });
    toast.success("Video ideas ready. Open Planner to edit titles, then write an audio script if you need one.", { id: "gen-plan" });
    for (const listener of resultListeners.plan) listener(data);
  });
}

export function startScriptGeneration(input: {
  itemId: string;
  title: string;
  description: string;
  language: Language;
  durationSeconds: VideoDuration;
}) {
  void runJob(
    "script",
    {
      title: input.title,
      description: input.description,
      language: input.language,
      durationSeconds: input.durationSeconds,
    },
    "gen-script",
    (result) => {
      if (!result || typeof result !== "object") return;
      const data = result as { script: string; durationSeconds: VideoDuration };
      const current = readDraft<{ items?: Array<Record<string, unknown>> }>("planner-draft");
      if (current?.items) {
        writeDraft("planner-draft", {
          ...current,
          items: current.items.map((item) =>
            item.id === input.itemId
              ? { ...item, script: data.script, durationSeconds: input.durationSeconds, scriptSource: "button" }
              : item,
          ),
        });
      }
      toast.success("Audio script ready.", { id: "gen-script" });
      for (const listener of resultListeners.script) {
        listener({ itemId: input.itemId, script: data.script, durationSeconds: input.durationSeconds });
      }
    },
    "/planner",
    input.itemId,
  );
}
