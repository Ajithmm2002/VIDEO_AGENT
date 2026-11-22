"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/badges";
import { Card, choiceClass, EmptyState } from "@/components/ui";
import type { Content, HashtagCollection } from "@/lib/types";
import { visiblePrompt } from "@/lib/utils";

const tabs = [
  ["published", "Published"],
  ["drafts", "Draft videos"],
  ["thumbnails", "Thumbnails"],
  ["descriptions", "Descriptions"],
  ["ideas", "Ideas"],
  ["references", "References"],
  ["hashtags", "Hashtags"],
] as const;

type LibraryView = (typeof tabs)[number][0];

function matches(item: Content, view: LibraryView) {
  if (view === "published") return item.status === "published";
  if (view === "drafts") return Boolean(item.video_url) && item.status !== "published";
  if (view === "thumbnails") return Boolean(item.thumbnail_path || item.thumbnail_prompt);
  if (view === "descriptions") return Boolean(item.description || item.youtube_description || item.instagram_caption);
  if (view === "ideas") return item.status === "idea";
  if (view === "references") return item.reference_links.length > 0 || Boolean(item.notes);
  return true;
}

export function LibraryBrowser({
  contents,
  collections,
  images,
  initialView,
}: {
  contents: Content[];
  collections: HashtagCollection[];
  images: Record<string, string>;
  initialView: string;
}) {
  const start = tabs.some(([id]) => id === initialView) ? (initialView as LibraryView) : "published";
  const [view, setView] = useState<LibraryView>(start);
  const visible = useMemo(() => contents.filter((item) => matches(item, view)), [contents, view]);

  function open(next: LibraryView) {
    setView(next);
    const url = next === "published" ? "/library" : `/library?view=${next}`;
    window.history.replaceState(null, "", url);
  }

  return (
    <div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => open(id)}
            className={choiceClass(view === id, "shrink-0 px-3.5")}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "hashtags" ? (
        <div className="grid gap-3">
          {collections.length ? collections.map((collection) => (
            <Card key={collection.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{collection.name}</h2>
                <p className="text-sm">{collection.hashtags.join(" ")}</p>
              </div>
              <CopyButton text={collection.hashtags.join(" ")} label="Copy" />
            </Card>
          )) : <Card><EmptyState title="No collections yet" body="Create reusable hashtag sets on the Hashtags page." /></Card>}
          <Link href="/hashtags" className="text-sm text-accent">Manage hashtag collections</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.length ? visible.map((item) => (
            <Card key={item.id} className="grid min-w-0 gap-2">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <Link href={`/content/${item.id}`} className="min-w-0 truncate font-semibold">{item.title}</Link>
                <div className="flex shrink-0 items-center gap-2">
                  <CopyButton compact text={item.title} label="Copy title" />
                  <StatusBadge status={item.status} />
                </div>
              </div>
              {view === "published" && item.published_url ? (
                <div className="flex min-w-0 items-start gap-2">
                  <a className="min-w-0 flex-1 text-sm text-accent break-all" href={item.published_url} target="_blank" rel="noreferrer">{item.published_url}</a>
                  <CopyButton compact text={item.published_url} label="Copy published URL" />
                </div>
              ) : null}
              {view === "drafts" && item.video_url ? (
                <div className="flex min-w-0 items-start gap-2">
                  <a className="min-w-0 flex-1 text-sm text-accent break-all" href={item.video_url} target="_blank" rel="noreferrer">{item.video_url}</a>
                  <CopyButton compact text={item.video_url} label="Copy video URL" />
                </div>
              ) : null}
              {view === "thumbnails" && item.thumbnail_path && images[item.thumbnail_path] ? (
                <>
                  {/* Signed Supabase URLs expire, so the image optimizer cannot cache them. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images[item.thumbnail_path]} alt="" className="max-h-48 rounded-xl object-cover" />
                </>
              ) : null}
              {view === "thumbnails" && visiblePrompt(item.thumbnail_prompt) ? (
                <div className="flex min-w-0 items-start gap-2">
                  <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-muted">{visiblePrompt(item.thumbnail_prompt)}</p>
                  <CopyButton compact text={visiblePrompt(item.thumbnail_prompt)} label="Copy thumbnail prompt" />
                </div>
              ) : null}
              {view === "descriptions" ? (
                <div className="flex min-w-0 items-start gap-2">
                  <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-muted">{item.youtube_description || item.instagram_caption || item.description}</p>
                  <CopyButton compact text={item.youtube_description || item.instagram_caption || item.description || ""} label="Copy description" />
                </div>
              ) : null}
              {view === "ideas" ? (
                <div className="flex min-w-0 items-start gap-2">
                  <p className="min-w-0 flex-1 text-sm text-muted">{item.topic || "No topic yet"}</p>
                  {item.topic ? <CopyButton compact text={item.topic} label="Copy topic" /> : null}
                </div>
              ) : null}
              {view === "references" ? (
                <div className="grid gap-1 text-sm">
                  {item.notes ? (
                    <div className="flex min-w-0 items-start gap-2">
                      <p className="min-w-0 flex-1 text-muted">{item.notes}</p>
                      <CopyButton compact text={item.notes} label="Copy notes" />
                    </div>
                  ) : null}
                  {item.reference_links.map((link) => (
                    <a key={link.id} href={link.url} className="text-accent" target="_blank" rel="noreferrer">{link.title}</a>
                  ))}
                </div>
              ) : null}
            </Card>
          )) : <Card><EmptyState title="Nothing in this section yet" body="Add a content item and it will appear in the matching library view." /></Card>}
        </div>
      )}
    </div>
  );
}
