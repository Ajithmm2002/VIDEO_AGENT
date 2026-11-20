import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/badges";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { listCollections, libraryContents, signedThumbnailMap } from "@/lib/queries";
import type { Content } from "@/lib/types";

export const metadata: Metadata = { title: "Library" };

const tabs = [
  ["published", "Published"],
  ["drafts", "Draft videos"],
  ["thumbnails", "Thumbnails"],
  ["descriptions", "Descriptions"],
  ["ideas", "Ideas"],
  ["references", "References"],
  ["hashtags", "Hashtags"],
] as const;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function matches(item: Content, view: string) {
  if (view === "published") return item.status === "published";
  if (view === "drafts") return Boolean(item.video_url) && item.status !== "published";
  if (view === "thumbnails") return Boolean(item.thumbnail_path || item.thumbnail_prompt);
  if (view === "descriptions") return Boolean(item.description || item.youtube_description || item.instagram_caption);
  if (view === "ideas") return item.status === "idea";
  if (view === "references") return item.reference_links.length > 0 || Boolean(item.notes);
  return true;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requested = first(params.view) ?? "published";
  const view = tabs.some(([id]) => id === requested) ? requested : "published";
  const [contents, collections] = await Promise.all([libraryContents(), listCollections()]);
  const visible = contents.filter((item) => matches(item, view));
  const images = view === "thumbnails" ? await signedThumbnailMap(visible) : new Map<string, string>();

  return (
    <div>
      <PageHeader eyebrow="Browse" title="Library" description="Published links, drafts, thumbnails, descriptions, ideas, references, and reusable hashtags." />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([id, label]) => (
          <Link
            key={id}
            href={`/library?view=${id}`}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${view === id ? "bg-accent text-accent-ink shadow-[0_10px_24px_-12px_rgb(var(--glow)/0.9)]" : "border border-line bg-surface/80 text-ink"}`}
          >
            {label}
          </Link>
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
            <Card key={item.id} className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/content/${item.id}`} className="font-semibold">{item.title}</Link>
                <StatusBadge status={item.status} />
              </div>
              {view === "published" && item.published_url ? <a className="text-sm text-accent break-all" href={item.published_url} target="_blank" rel="noreferrer">{item.published_url}</a> : null}
              {view === "drafts" && item.video_url ? <a className="text-sm text-accent break-all" href={item.video_url} target="_blank" rel="noreferrer">{item.video_url}</a> : null}
              {view === "thumbnails" && item.thumbnail_path && images.get(item.thumbnail_path) ? (
                <>
                  {/* Signed Supabase URLs expire, so the image optimizer cannot cache them. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images.get(item.thumbnail_path)} alt="" className="max-h-48 rounded-xl object-cover" />
                </>
              ) : null}
              {view === "thumbnails" && item.thumbnail_prompt ? <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted">{item.thumbnail_prompt}</p> : null}
              {view === "descriptions" ? <p className="whitespace-pre-wrap text-sm text-muted">{item.youtube_description || item.instagram_caption || item.description}</p> : null}
              {view === "ideas" ? <p className="text-sm text-muted">{item.topic || "No topic yet"}</p> : null}
              {view === "references" ? (
                <div className="grid gap-1 text-sm">
                  {item.notes ? <p className="text-muted">{item.notes}</p> : null}
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
