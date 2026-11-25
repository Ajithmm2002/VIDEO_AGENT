"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Card, TextInput, choiceClass } from "@/components/ui";
import { CAPTION_TEMPLATES, TEMPLATE_KINDS, fillTemplate, type TemplateKind } from "@/lib/caption-templates";

function Highlighted({ text }: { text: string }) {
  // Show the placeholders still left to fill in a different colour.
  const parts = text.split(/(\{[^}]+\})/g);
  return (
    <>
      {parts.map((part, index) =>
        /^\{[^}]+\}$/.test(part) ? (
          <span key={index} className="rounded bg-accent-soft px-1 font-medium text-accent">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export function TemplateLibrary() {
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState<TemplateKind | "all">("all");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CAPTION_TEMPLATES.filter((template) => (kind === "all" || template.kind === kind) && (!needle || `${template.label} ${template.text}`.toLowerCase().includes(needle)));
  }, [kind, query]);

  return (
    <div className="grid gap-5">
      <Card className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Your topic</span>
          <TextInput value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="for example: Kerala fish curry" maxLength={120} />
          <span className="text-[13px] text-muted">Fills every {"{topic}"}. Other highlighted parts are yours to edit after copying.</span>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Search templates</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="mistake, recipe, review…" className="pl-9" />
          </span>
        </label>
      </Card>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Template type">
        <button type="button" className={choiceClass(kind === "all")} aria-pressed={kind === "all"} onClick={() => setKind("all")}>
          All
        </button>
        {TEMPLATE_KINDS.map((option) => (
          <button key={option.id} type="button" className={choiceClass(kind === option.id)} aria-pressed={kind === option.id} onClick={() => setKind(option.id)} title={option.hint}>
            {option.label}
          </button>
        ))}
      </div>

      {shown.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((template) => {
            const filled = fillTemplate(template.text, topic);
            return (
              <Card key={template.id} className="flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                    {TEMPLATE_KINDS.find((item) => item.id === template.kind)?.label} · {template.label}
                  </span>
                  <CopyButton text={filled} label={`Copy ${template.label}`} compact />
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6">
                  <Highlighted text={filled} />
                </p>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">No templates match that search.</p>
      )}
    </div>
  );
}
