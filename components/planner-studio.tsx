"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generatePlan, saveContentPlan } from "@/lib/actions/generate";
import { Button, Card, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { ideaThemeLabels, languageLabels, planHorizonLabels, platformLabels } from "@/lib/labels";
import type { Category, IdeaTheme, Language, PlanHorizon, Platform } from "@/lib/types";
import { ideaThemes, languages, planHorizons, platforms } from "@/lib/types";
import { clearDraft, readDraft, writeDraft } from "@/lib/draft";
import { newId, planItemCount, todayISO } from "@/lib/utils";

type DraftItem = {
  id: string;
  title: string;
  topic: string;
  description: string;
  planned_date: string;
  included: boolean;
};

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
  const [language, setLanguage] = useState<Language>("en");
  const [platform, setPlatform] = useState<Platform>("both");
  const [themes, setThemes] = useState<IdeaTheme[]>(["comedy", "nostalgia"]);
  const [extraThemes, setExtraThemes] = useState("");
  const [description, setDescription] = useState("");
  const [horizon, setHorizon] = useState<PlanHorizon>("week");
  const [startDate, setStartDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [provider, setProvider] = useState<"local" | "remote" | null>(null);
  const [generating, setGenerating] = useState(false);
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
      horizon: PlanHorizon;
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
      if (stored.horizon) setHorizon(stored.horizon);
      if (stored.startDate) setStartDate(stored.startDate);
      setCategoryId(stored.categoryId ?? "");
      if (stored.items?.length) setItems(stored.items);
      setProvider(stored.provider ?? null);
    }
    setDraftReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    writeDraft("planner-draft", {
      language,
      platform,
      themes,
      extraThemes,
      description,
      horizon,
      startDate,
      categoryId,
      items,
      provider,
    });
  }, [draftReady, language, platform, themes, extraThemes, description, horizon, startDate, categoryId, items, provider]);

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

  async function onGenerate() {
    setGenerating(true);
    try {
      const result = await generatePlan({
        language,
        platform,
        themes: allThemes(),
        description,
        horizon,
        startDate,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProvider(result.result.provider);
      setItems(
        result.result.items.map((item) => ({
          id: newId(),
          title: item.title,
          topic: item.topic,
          description: item.description,
          planned_date: item.planned_date,
          included: true,
        })),
      );
      toast.success(
        result.result.provider === "remote"
          ? `${result.result.items.length} ideas ready. Edit anything, then save.`
          : aiConnected
            ? "Gemini was busy, so a local plan was used. Edit anything, then save."
            : "Local plan ready. Edit anything, then save.",
      );
    } finally {
      setGenerating(false);
    }
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
            Choose language, categories, and a short brief. The planner fills a week or a month. You can edit every idea before it hits the calendar.
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
        <Field label="What should this plan be about?" hint="A topic, a feeling, or a few lines. Malayalam or English.">
          <TextArea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Plan length">
            <SelectInput value={horizon} onChange={(event) => setHorizon(event.target.value as PlanHorizon)}>
              {planHorizons.map((item) => (
                <option key={item} value={item}>
                  {planHorizonLabels[item]} · {planItemCount(item)} ideas
                </option>
              ))}
            </SelectInput>
          </Field>
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
          {generating ? "Planning…" : horizon === "week" ? "Suggest a week of ideas" : "Suggest a month of ideas"}
        </Button>
      </Card>

      {items.length ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Suggested plan</h2>
            <p className="text-sm text-muted">Uncheck ideas to skip them. Change titles, copy, and dates.</p>
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
                <Field label="Title">
                  <TextInput value={item.title} onChange={(event) => patchItem(item.id, { title: event.target.value })} maxLength={200} />
                </Field>
                <Field label="Date">
                  <TextInput type="date" value={item.planned_date} onChange={(event) => patchItem(item.id, { planned_date: event.target.value })} />
                </Field>
              </div>
              <Field label="Topic">
                <TextInput value={item.topic} onChange={(event) => patchItem(item.id, { topic: event.target.value })} maxLength={500} />
              </Field>
              <Field label="Description">
                <TextArea value={item.description} onChange={(event) => patchItem(item.id, { description: event.target.value })} />
              </Field>
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
