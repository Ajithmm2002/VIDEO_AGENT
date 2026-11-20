"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveContentPlan } from "@/lib/actions/generate";
import { onGenerationResult, startPlanGeneration, startScriptGeneration, useGenerationJobs } from "@/lib/background-generate";
import { CopyButton } from "@/components/copy-button";
import { Button, Card, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { ideaThemeLabels, languageLabels, planDayLabel, platformLabels, videoDurationLabels } from "@/lib/labels";
import type { Category, IdeaTheme, Language, Platform, VideoDuration } from "@/lib/types";
import { ideaThemes, languages, planDays, platforms, videoDurations } from "@/lib/types";
import { clearDraft, readDraft, writeDraft } from "@/lib/draft";
import { isVideoDuration, newId, todayISO } from "@/lib/utils";

type DraftItem = {
  id: string;
  title: string;
  topic: string;
  description: string;
  script: string;
  durationSeconds: VideoDuration;
  planned_date: string;
  included: boolean;
};

function DurationPills({
  value,
  onChange,
  disabled,
}: {
  value: VideoDuration;
  onChange: (value: VideoDuration) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {videoDurations.map((seconds) => {
        const on = value === seconds;
        return (
          <button
            key={seconds}
            type="button"
            disabled={disabled}
            onClick={() => onChange(seconds)}
            className={`rounded-full px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${on ? "bg-accent text-accent-ink" : "border border-line bg-surface text-ink"}`}
          >
            {videoDurationLabels[seconds]}
          </button>
        );
      })}
    </div>
  );
}

export function PlannerStudio({
  configured,
  aiConnected,
  categories,
}: {
  configured: boolean;
  aiConnected: boolean;
  categories: Category[];
}) {
  const router = useRouter();
  const jobs = useGenerationJobs();
  const generating = jobs.plan.pending;
  const scriptingId = jobs.script.pending ? jobs.script.itemId : null;
  const [language, setLanguage] = useState<Language>("en");
  const [platform, setPlatform] = useState<Platform>("both");
  const [themes, setThemes] = useState<IdeaTheme[]>(["comedy", "nostalgia"]);
  const [extraThemes, setExtraThemes] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<number>(7);
  const [durationSeconds, setDurationSeconds] = useState<VideoDuration>(30);
  const [startDate, setStartDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [provider, setProvider] = useState<"local" | "remote" | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- restore unsaved work after switching pages */
    const stored = readDraft<{
      language: Language;
      platform: Platform;
      themes: IdeaTheme[];
      extraThemes: string;
      description: string;
      days?: number;
      horizon?: string;
      durationSeconds?: number;
      startDate: string;
      categoryId: string;
      items: DraftItem[];
      provider: "local" | "remote" | null;
    }>("planner-draft");
    if (stored) {
      if (stored.language) setLanguage(stored.language);
      if (stored.platform) setPlatform(stored.platform);
      if (stored.themes?.length) setThemes(stored.themes);
      setExtraThemes(stored.extraThemes ?? "");
      setDescription(stored.description ?? "");
      if (stored.days && stored.days >= 1 && stored.days <= 7) setDays(stored.days);
      else if (stored.horizon === "week" || stored.horizon === "month") setDays(7);
      if (stored.durationSeconds && isVideoDuration(stored.durationSeconds)) setDurationSeconds(stored.durationSeconds);
      if (stored.startDate) setStartDate(stored.startDate);
      setCategoryId(stored.categoryId ?? "");
      if (stored.items?.length) {
        setItems(
          stored.items.map((item) => ({
            ...item,
            script: item.script ?? "",
            durationSeconds: isVideoDuration(item.durationSeconds) ? item.durationSeconds : 30,
            included: item.included !== false,
          })),
        );
      }
      setProvider(stored.provider ?? null);
    }
    setDraftReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    return onGenerationResult<{
      provider: "local" | "remote";
      items: Array<{
        title: string;
        topic: string;
        description: string;
        script: string;
        durationSeconds: VideoDuration;
        planned_date: string;
      }>;
    }>("plan", (result) => {
      setProvider(result.provider);
      setItems(
        result.items.map((item) => ({
          id: newId(),
          title: item.title,
          topic: item.topic,
          description: item.description,
          script: item.script ?? "",
          durationSeconds: isVideoDuration(item.durationSeconds) ? item.durationSeconds : durationSeconds,
          planned_date: item.planned_date,
          included: true,
        })),
      );
    });
  }, [durationSeconds]);

  useEffect(() => {
    return onGenerationResult<{ itemId: string; script: string; durationSeconds: VideoDuration }>("script", (result) => {
      setItems((current) =>
        current.map((item) =>
          item.id === result.itemId
            ? { ...item, script: result.script, durationSeconds: result.durationSeconds }
            : item,
        ),
      );
    });
  }, []);

  useEffect(() => {
    if (!draftReady || generating) return;
    writeDraft("planner-draft", {
      language,
      platform,
      themes,
      extraThemes,
      description,
      days,
      durationSeconds,
      startDate,
      categoryId,
      items,
      provider,
    });
  }, [draftReady, generating, language, platform, themes, extraThemes, description, days, durationSeconds, startDate, categoryId, items, provider]);

  function allThemes() {
    const extra = extraThemes.split(/[,/]+/).map((item) => item.trim()).filter(Boolean);
    return [...themes, ...extra];
  }

  function toggleTheme(theme: IdeaTheme) {
    setThemes((current) => (current.includes(theme) ? current.filter((item) => item !== theme) : [...current, theme]));
  }

  function patchItem(id: string, partial: Partial<DraftItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...partial } : item)));
  }

  function onGenerate() {
    startPlanGeneration({
      language,
      platform,
      themes: allThemes(),
      description,
      days,
      durationSeconds,
      startDate,
    });
  }

  async function onSave() {
    const selected = items.filter((item) => item.included && item.title.trim());
    if (!selected.length) {
      toast.error("Keep at least one idea with a title.");
      return;
    }
    setSaving(true);
    try {
      const result = await saveContentPlan({
        language,
        platform,
        category_id: categoryId || null,
        items: selected.map((item) => ({
          title: item.title,
          topic: item.topic,
          description: item.description,
          script: item.script,
          durationSeconds: item.durationSeconds,
          planned_date: item.planned_date,
        })),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Plan saved");
      clearDraft("planner-draft");
      router.push("/calendar");
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
            Get video titles, how-to-shoot notes, and a spoken audio script. Plans run from 1 day to 1 week. You can edit everything before saving.
          </p>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${provider === "remote" ? "bg-accent/12 text-accent" : "bg-surface-2 text-muted"}`}>
            {provider === "remote" ? "Gemini" : aiConnected ? "Gemini when available" : "Local templates"}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
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
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium">Categories</p>
          <div className="flex flex-wrap gap-2">
            {ideaThemes.map((theme) => {
              const on = themes.includes(theme);
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => toggleTheme(theme)}
                  className={`rounded-full px-3 py-1.5 text-sm ${on ? "bg-accent text-accent-ink" : "border border-line bg-surface text-ink"}`}
                >
                  {ideaThemeLabels[theme]}
                </button>
              );
            })}
          </div>
        </div>
        <Field label="Other categories" hint="Optional. Comma-separated, for example travel, gaming.">
          <TextInput value={extraThemes} onChange={(event) => setExtraThemes(event.target.value)} maxLength={200} />
        </Field>
        <Field label="What should these videos be about?" hint="A topic or a few lines. Malayalam or English. Each idea becomes a video title.">
          <TextArea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} />
        </Field>
        <div className="grid gap-2">
          <p className="text-sm font-medium">Plan length</p>
          <div className="flex flex-wrap gap-2">
            {planDays.map((count) => {
              const on = days === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => setDays(count)}
                  className={`rounded-full px-3 py-1.5 text-sm ${on ? "bg-accent text-accent-ink" : "border border-line bg-surface text-ink"}`}
                >
                  {planDayLabel(count)}
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-5 text-muted">One video idea per day, up to one week.</p>
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium">Video length</p>
          <DurationPills value={durationSeconds} onChange={setDurationSeconds} />
          <p className="text-xs leading-5 text-muted">Audio scripts are written to this length. You can change it on any idea later.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Start date">
            <TextInput type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </Field>
          <Field label="Save into category" hint={configured ? "Optional. Uses one of your saved categories." : "Connect Supabase to save."}>
            <SelectInput value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={!configured}>
              <option value="">No category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </SelectInput>
          </Field>
        </div>
        <Button className="w-fit" onClick={onGenerate} loading={generating} disabled={saving}>
          {generating ? "Planning…" : `Suggest ${planDayLabel(days)} of video ideas`}
        </Button>
      </Card>

      {items.length ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Suggested videos</h2>
            <p className="text-sm text-muted">Title is the idea. Description is how to shoot it. Edit the audio script or rewrite it for another length.</p>
          </div>
          {items.map((item, index) => (
            <Card key={item.id} className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={item.included}
                    onChange={(event) => patchItem(item.id, { included: event.target.checked })}
                  />
                  Idea {index + 1}
                </label>
                <Button variant="ghost" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_10rem]">
                <Field label="Video title">
                  <TextInput value={item.title} onChange={(event) => patchItem(item.id, { title: event.target.value })} maxLength={200} />
                </Field>
                <Field label="Date">
                  <TextInput type="date" value={item.planned_date} onChange={(event) => patchItem(item.id, { planned_date: event.target.value })} />
                </Field>
              </div>
              <Field label="How to execute" hint="Shot order, what to film, and how to perform it.">
                <TextArea value={item.description} onChange={(event) => patchItem(item.id, { description: event.target.value })} />
              </Field>
              <div className="grid gap-2">
                <p className="text-sm font-medium">Audio length</p>
                <DurationPills
                  value={item.durationSeconds}
                  onChange={(value) => patchItem(item.id, { durationSeconds: value })}
                  disabled={scriptingId === item.id}
                />
              </div>
              <Field label="Audio script" hint="Spoken words for this length. Edit freely, or rewrite after you change the time.">
                <TextArea className="min-h-40" value={item.script} onChange={(event) => patchItem(item.id, { script: event.target.value })} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  loading={scriptingId === item.id}
                  disabled={!item.title.trim() || generating || (Boolean(scriptingId) && scriptingId !== item.id)}
                  onClick={() =>
                    startScriptGeneration({
                      itemId: item.id,
                      title: item.title,
                      description: item.description,
                      language,
                      durationSeconds: item.durationSeconds,
                    })
                  }
                >
                  {scriptingId === item.id ? "Writing script…" : `Write ${videoDurationLabels[item.durationSeconds]} audio script`}
                </Button>
                <CopyButton text={item.script} label="Copy script" />
              </div>
            </Card>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                setItems((current) => [
                  ...current,
                  {
                    id: newId(),
                    title: "",
                    topic: "",
                    description: "",
                    script: "",
                    durationSeconds,
                    planned_date: current.at(-1)?.planned_date || startDate,
                    included: true,
                  },
                ])
              }
            >
              Add idea
            </Button>
            <Button onClick={onSave} loading={saving} disabled={!configured || generating}>
              {saving ? "Saving…" : "Save plan to calendar"}
            </Button>
          </div>
          {configured ? null : <p className="text-sm text-muted">Connect Supabase before saving. Your edits stay on this page until you leave.</p>}
        </div>
      ) : null}
    </div>
  );
}
