import Link from "next/link";
import { BadgePercent, CalendarDays, Gamepad2, ImageIcon, PenLine, Sparkles, Store } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  { icon: ImageIcon, title: "Thumbnail prompts", body: "Landscape and vertical prompts, ready to paste into Google Flow." },
  { icon: PenLine, title: "Writing drafts", body: "Titles, captions, hashtags, and a script outline in Malayalam or English." },
  { icon: CalendarDays, title: "Quiet calendar", body: "Drop ideas onto a day. Each account stays private." },
  { icon: BadgePercent, title: "Affiliate ads", body: "Load a product link, then generate a studio image or video prompt." },
  { icon: Store, title: "Marketplace", body: "Buy and sell digital products. Downloads live in Purchases, not on the listing floor." },
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
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-bg/90 px-4 py-3 sm:px-8">
        <BrandMark href="/" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden min-h-11 items-center rounded-md border border-line bg-surface px-3.5 text-sm font-semibold sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href={startHref}
            className="ig-gradient inline-flex min-h-11 items-center rounded-md px-3.5 text-sm font-semibold text-white"
          >
            {configured ? "Get started" : "Open studio"}
          </Link>
        </div>
      </header>

      <section className="billboard px-4 py-16 sm:px-8 sm:py-24 lg:min-h-[70vh] lg:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="ig-text text-[11px] font-semibold uppercase tracking-[0.22em]">Personal workspace</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Plan the next video before you record it.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">
            YouTube and Instagram ideas, thumbnail prompts, captions, and publishing dates in one private studio.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={startHref}
              className="ig-gradient inline-flex min-h-12 items-center gap-2 rounded-md px-5 text-sm font-semibold text-white"
            >
              <Sparkles className="h-4 w-4" />
              {configured ? "Start a workspace" : "Open the studio"}
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center rounded-md border border-line bg-surface/80 px-5 text-sm font-semibold"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-8">
        <h2 className="text-xl font-semibold tracking-tight">More reasons to join</h2>
        <div className="media-row mt-4">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="w-[min(18rem,80vw)] rounded-md border border-line bg-surface p-4"
              >
                <span className="ig-gradient grid h-10 w-10 place-items-center rounded-md text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-5 text-muted">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-8">
        <h2 className="text-xl font-semibold tracking-tight">On your board</h2>
        <div className="media-row mt-4">
          {previewCards.map((card) => (
            <article
              key={card.title}
              className="w-[min(16rem,78vw)] rounded-md border border-line bg-surface-2 p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{card.eyebrow}</p>
              <p className="mt-2 text-base font-semibold tracking-tight">{card.title}</p>
              <p className="mt-1 text-sm text-muted">{card.meta}</p>
            </article>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted">Malayalam and English. Your rows stay on your account.</p>
      </section>
    </div>
  );
}
