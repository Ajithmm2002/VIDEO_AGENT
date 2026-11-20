import type { Metadata } from "next";
import Link from "next/link";
import { ContentActions } from "@/components/content-actions";
import { LanguageBadge, PlatformBadge, StatusBadge } from "@/components/badges";
import { Button, Card, EmptyState, PageHeader, SelectInput, TextInput } from "@/components/ui";
import { languageLabels, platformLabels, statusLabels } from "@/lib/labels";
import { listCategories, listContents, type ContentFilters } from "@/lib/queries";
import { checklistProgress, formatDate } from "@/lib/utils";
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
        action={<Link href="/content/new" className="inline-flex items-center rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_-12px_rgb(var(--glow)/0.9)]">New content</Link>}
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
          <Button type="submit" className="w-fit">Apply</Button>
        </form>
      </Card>
      <div className="grid gap-3">
        {contents.length ? contents.map((item) => (
          <Card key={item.id} className="flex flex-wrap items-center justify-between gap-4 hover:border-accent/35">
            <div>
              <Link href={`/content/${item.id}`} className="font-semibold hover:text-accent">{item.title}</Link>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <StatusBadge status={item.status} />
                <PlatformBadge platform={item.platform} />
                <LanguageBadge language={item.language} />
                {item.category ? <span className="text-xs text-muted">{item.category.name}</span> : null}
                {item.is_template ? <span className="text-xs text-muted">Template</span> : null}
                <span className="text-xs text-muted">{formatDate(item.planned_date)}</span>
                {checklistProgress(item.checklist) ? <span className="text-xs text-muted">{checklistProgress(item.checklist)}</span> : null}
              </div>
            </div>
            <ContentActions id={item.id} />
          </Card>
        )) : (
          <Card>
            <EmptyState title="No matching content" body="Try another search, or create a new idea from this page." />
          </Card>
        )}
      </div>
    </div>
  );
}
