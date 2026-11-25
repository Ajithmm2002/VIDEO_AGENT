import type { Metadata } from "next";
import Link from "next/link";
import { ContentList } from "@/components/content-list";
import { SubmitButton } from "@/components/submit-button";
import { Card, PageHeader, SelectInput, TextInput } from "@/components/ui";
import { languageLabels, platformLabels, statusLabels } from "@/lib/labels";
import { listCategories, listContents, type ContentFilters } from "@/lib/queries";
import { languages, platforms, statuses } from "@/lib/types";

export const metadata: Metadata = { title: "Content" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: ContentFilters = {
    q: first(params.q),
    platform: first(params.platform),
    language: first(params.language),
    status: first(params.status),
    category: first(params.category),
    sort: first(params.sort),
    templates: first(params.templates),
  };
  const [contents, categories] = await Promise.all([listContents(filters), listCategories()]);

  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title="Content"
        description="Search, filter, and open any idea, draft, or published post."
        action={<Link href="/content/new" className="bg-accent inline-flex items-center rounded-xl px-3.5 py-2 text-sm font-semibold text-accent-ink shadow-[var(--shadow-glow)]">New content</Link>}
      />
      <Card className="mb-4">
        <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <TextInput name="q" defaultValue={filters.q} placeholder="Search title or topic" aria-label="Search" />
          <SelectInput name="platform" defaultValue={filters.platform ?? ""} aria-label="Platform">
            <option value="">All platforms</option>
            {platforms.map((platform) => <option key={platform} value={platform}>{platformLabels[platform]}</option>)}
          </SelectInput>
          <SelectInput name="language" defaultValue={filters.language ?? ""} aria-label="Language">
            <option value="">All languages</option>
            {languages.map((language) => <option key={language} value={language}>{languageLabels[language]}</option>)}
          </SelectInput>
          <SelectInput name="status" defaultValue={filters.status ?? ""} aria-label="Status">
            <option value="">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
          </SelectInput>
          <SelectInput name="category" defaultValue={filters.category ?? ""} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </SelectInput>
          <SelectInput name="sort" defaultValue={filters.sort ?? "updated"} aria-label="Sort">
            <option value="updated">Recently updated</option>
            <option value="planned">Planned date</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </SelectInput>
          <SelectInput name="templates" defaultValue={filters.templates ?? ""} aria-label="Templates" className="xl:col-span-2">
            <option value="">Hide templates</option>
            <option value="only">Templates only</option>
            <option value="all">Content and templates</option>
          </SelectInput>
          <SubmitButton className="w-fit" pendingLabel="Applying…">Apply</SubmitButton>
        </form>
      </Card>
      <ContentList contents={contents} />
    </div>
  );
}
