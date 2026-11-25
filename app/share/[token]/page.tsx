import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Eye } from "lucide-react";
import { StatusBadge } from "@/components/badges";
import { CopyButton } from "@/components/copy-button";
import { getSharedContent } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Content for review", robots: { index: false, follow: false } };

const PLATFORM: Record<string, string> = { youtube: "YouTube", instagram: "Instagram", both: "YouTube and Instagram" };
const LANGUAGE: Record<string, string> = { en: "English", ml: "Malayalam" };

function Block({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{label}</h2>
        <CopyButton text={text} label={`Copy ${label.toLowerCase()}`} compact />
      </div>
      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7">{text}</p>
    </section>
  );
}

export default async function SharedContentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const item = await getSharedContent(token);
  if (!item) notFound();

  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-ink sm:py-12">
      <div className="mx-auto grid max-w-2xl gap-4">
        <p className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          <Eye className="h-3.5 w-3.5" aria-hidden />
          Read-only review{item.author ? ` · shared by ${item.author}` : ""}
        </p>
        <header className="grid gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{item.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <StatusBadge status={item.status} />
            <span>{PLATFORM[item.platform] ?? item.platform}</span>
            <span aria-hidden>·</span>
            <span>{LANGUAGE[item.language] ?? item.language}</span>
            {item.planned_date ? (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  Planned for {formatDate(item.planned_date)}
                </span>
              </>
            ) : null}
          </div>
          {item.topic ? <p className="text-[15px] leading-6 text-muted">{item.topic}</p> : null}
        </header>

        <Block label="Description" text={item.description} />
        <Block label="YouTube description" text={item.youtube_description} />
        <Block label="Instagram caption" text={item.instagram_caption} />
        <Block label="Script and shot notes" text={item.script_notes} />
        <Block label="YouTube tags" text={item.tags.length ? item.tags.join(", ") : null} />
        <Block label="Hashtags" text={item.hashtags.length ? item.hashtags.join(" ") : null} />

        <footer className="pt-2 text-center text-xs text-muted">
          Last updated {formatDate(item.updated_at)} · Shared from Content Studio. Reply to the person who sent you this link with your feedback.
        </footer>
      </div>
    </main>
  );
}
