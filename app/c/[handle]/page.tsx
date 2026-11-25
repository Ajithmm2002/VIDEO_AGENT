import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Camera, ChevronRight, Globe, Languages, Mail, MapPin, Play, Tag } from "lucide-react";
import { getPublicCreatorPage } from "@/lib/queries";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const page = await getPublicCreatorPage(handle);
  if (!page) return { title: "Page not found", robots: { index: false } };
  const name = page.display_name || `@${page.handle}`;
  return {
    title: { absolute: `${name} · Creator page` },
    description: page.page.headline || `${name}'s links and media kit.`,
    openGraph: { title: name, description: page.page.headline || undefined, type: "profile" },
  };
}

function initials(name: string) {
  const parts = name.replace(/^@/, "").trim().split(/\s+/);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2)).toUpperCase();
}

export default async function PublicCreatorPage({ params }: Props) {
  const { handle } = await params;
  const data = await getPublicCreatorPage(handle);
  if (!data) notFound();
  const { page } = data;
  const name = data.display_name || `@${data.handle}`;
  const stats = [
    { label: "YouTube subscribers", value: page.youtube_subscribers },
    { label: "Instagram followers", value: page.instagram_followers },
    { label: "Average views", value: page.average_views },
  ].filter((stat) => stat.value);
  const facts = [
    { icon: Tag, value: page.niche },
    { icon: MapPin, value: page.location },
    { icon: Languages, value: page.languages },
  ].filter((fact) => fact.value);

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-ink sm:py-16">
      <div className="mx-auto grid max-w-md gap-6">
        <header className="grid justify-items-center gap-3 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-accent text-2xl font-bold text-accent-ink shadow-[var(--shadow-glow)]" aria-hidden>
            {initials(name)}
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <p className="text-sm text-muted">@{data.handle}</p>
          </div>
          {page.headline ? <p className="max-w-sm text-[15px] leading-6">{page.headline}</p> : null}
          {facts.length ? (
            <ul className="flex flex-wrap justify-center gap-2">
              {facts.map((fact) => {
                const Icon = fact.icon;
                return (
                  <li key={fact.value} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium">
                    <Icon className="h-3.5 w-3.5 text-muted" aria-hidden />
                    {fact.value}
                  </li>
                );
              })}
            </ul>
          ) : null}
          {page.youtube_url || page.instagram_url ? (
            <div className="flex gap-2">
              {page.youtube_url ? (
                <a href={page.youtube_url} target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface hover:bg-surface-2" aria-label="YouTube channel">
                  <Play className="h-4 w-4" style={{ color: "var(--youtube)" }} />
                </a>
              ) : null}
              {page.instagram_url ? (
                <a href={page.instagram_url} target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface hover:bg-surface-2" aria-label="Instagram profile">
                  <Camera className="h-4 w-4" style={{ color: "var(--instagram)" }} />
                </a>
              ) : null}
            </div>
          ) : null}
        </header>

        {data.links.length ? (
          <nav className="grid gap-3" aria-label="Links">
            {data.links.map((link) => (
              <a
                key={link.id}
                href={`/go/${link.id}`}
                rel="noopener"
                className="group flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-3 font-semibold shadow-[var(--shadow)] hover:border-accent/50 hover:bg-accent-soft"
              >
                <span className="min-w-0 truncate">{link.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
              </a>
            ))}
          </nav>
        ) : null}

        {stats.length ? (
          <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Audience</h2>
            <dl className={`mt-3 grid gap-3 ${stats.length === 1 ? "grid-cols-1" : stats.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="text-xl font-semibold tabular-nums">{stat.value}</dd>
                  <dt className="text-xs leading-4 text-muted">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {page.rates.length ? (
          <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Work with me</h2>
            <ul className="mt-3 divide-y divide-line">
              {page.rates.map((rate) => (
                <li key={`${rate.label}-${rate.price}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span>{rate.label}</span>
                  <span className="font-semibold tabular-nums">{rate.price || "On request"}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {page.contact_email ? (
          <a
            href={`mailto:${page.contact_email}?subject=${encodeURIComponent("Collaboration enquiry")}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-5 font-semibold text-accent-ink hover:bg-accent-2"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Contact for collaborations
          </a>
        ) : null}

        <footer className="pt-4 text-center text-xs text-muted">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-ink">
            <Globe className="h-3.5 w-3.5" aria-hidden />
            Made with Content Studio
          </Link>
        </footer>
      </div>
    </main>
  );
}
