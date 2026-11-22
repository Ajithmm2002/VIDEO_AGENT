import Link from "next/link";
import { BadgePercent, CalendarDays, Gamepad2, ImageIcon, PenLine, Sparkles, Store } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  { icon: ImageIcon, title: "Thumbnail prompts", body: "Landscape and vertical prompts, ready to paste into Google Flow." },
  { icon: PenLine, title: "Writing drafts", body: "Titles, captions, hashtags, and a script outline in Malayalam or English." },
  { icon: CalendarDays, title: "Quiet calendar", body: "Drop ideas onto a day. Each account stays private." },
  { icon: BadgePercent, title: "Affiliate ads", body: "Load a product link, then generate a studio image or video prompt." },
  { icon: Store, title: "Marketplace", body: "Shop the product grid, read ratings and short reviews, then download from Purchases." },
  { icon: Gamepad2, title: "Fun mode", body: "Earn studio coins by playing, or buy coin packs, then spend them in the marketplace. Coins are not cash." },
];

const previewCards = [
  { eyebrow: "Reel · 30s", title: "First 10 seconds of nostalgia", meta: "Comedy · Draft" },
  { eyebrow: "Affiliate", title: "Studio ad for the listing", meta: "Image prompt ready" },
  { eyebrow: "YouTube", title: "Thursday title, tags, and hook", meta: "Scheduled" },
  { eyebrow: "Planner", title: "Seven days of how-to ideas", meta: "Ready to film" },
];

export function LandingPage({ configured }: { configured: boolean }) {
  const startHref = configured ? "/register" : "/dashboard";

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-bg/95 px-4 py-4 sm:px-8">
        <BrandMark href="/" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden min-h-11 items-center rounded-md border border-line bg-surface px-4 text-base font-semibold sm:inline-flex sm:text-sm"
          >
            Sign in
          </Link>
          <Link
            href={startHref}
            className="ig-gradient inline-flex min-h-11 items-center rounded-md px-4 text-base font-semibold text-accent-ink sm:text-sm"
          >
            {configured ? "Get started" : "Open studio"}
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="billboard px-4 py-20 sm:px-8 sm:py-28 lg:min-h-[68vh] lg:py-32">
          <div className="mx-auto max-w-3xl">
            <p className="ig-text text-xs font-semibold uppercase tracking-[0.18em]">Personal workspace</p>
            <h1 className="mt-5 max-w-xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Plan the next video before you record it.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              YouTube and Instagram ideas, thumbnail prompts, captions, and publishing dates in one private studio.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href={startHref}
                className="ig-gradient inline-flex min-h-12 items-center gap-2 rounded-md px-5 text-base font-semibold text-accent-ink sm:text-sm"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                {configured ? "Start a workspace" : "Open the studio"}
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center rounded-md border border-line bg-surface px-5 text-base font-semibold sm:text-sm"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">More reasons to join</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            The same icons appear in the studio, so you always know where you are. Each block is one job: prompts, writing, dates, ads, shop, or play.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-md border border-line bg-surface p-6"
                >
                  <span className="ig-gradient grid h-11 w-11 place-items-center rounded-md text-accent-ink">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-base leading-7 text-muted">{item.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">On your board</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            A calm mix of titles and status, with space around each idea so nothing feels cramped.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {previewCards.map((card) => (
              <article
                key={card.title}
                className="rounded-md border border-line bg-surface-2 p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{card.eyebrow}</p>
                <p className="mt-4 text-lg font-semibold tracking-tight">{card.title}</p>
                <p className="mt-2 text-base text-muted">{card.meta}</p>
              </article>
            ))}
          </div>
          <p className="mt-12 text-base text-muted">Malayalam and English. Your rows stay on your account.</p>
        </section>
      </main>
    </div>
  );
}
