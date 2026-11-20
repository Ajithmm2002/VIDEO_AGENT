import type { Metadata } from "next";
import { LibraryBrowser } from "@/components/library-browser";
import { PageHeader } from "@/components/ui";
import { listCollections, libraryContents, signedThumbnailMap } from "@/lib/queries";

export const metadata: Metadata = { title: "Library" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [contents, collections] = await Promise.all([libraryContents(), listCollections()]);
  const images = await signedThumbnailMap(contents);

  return (
    <div>
      <PageHeader eyebrow="Browse" title="Library" description="Published links, drafts, thumbnails, descriptions, ideas, references, and reusable hashtags." />
      <LibraryBrowser
        contents={contents}
        collections={collections}
        images={Object.fromEntries(images)}
        initialView={first(params.view) ?? "published"}
      />
    </div>
  );
}
