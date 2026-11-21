import Link from "next/link";
import { BadgePercent, CalendarDays, Gamepad2, ImageIcon, PenLine, Sparkles, Store } from "lucide-react";
import { AmbientGlow } from "@/components/ambient-glow";
import { BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  { icon: ImageIcon, title: "Thumbnail prompts", body: "Landscape and vertical prompts, ready to paste into Google Flow." },
  { icon: PenLine, title: "Writing drafts", body: "Titles, captions, hashtags, and a script outline in Malayalam or English." },
  { icon: CalendarDays, title: "Quiet calendar", body: "Drop ideas onto a day. Each account stays private." },
  { icon: BadgePercent, title: "Affiliate ads", body: "Load a product link, then generate a studio image or video prompt." },
  { icon: Store, title: "Skill shop", body: "Browse every listed skill and digital product, then pay with coins or rupees on the same page." },
  { icon: Gamepad2, title: "Fun mode", body: "Earn studio coins by playing, then redeem them in the skill shop. Coins are not cash and cannot be transferred." },
];

const previewCards = [
  { delay: "0s", eyebrow: "Reel · 30s", title: "First 10 seconds of nostalgia", meta: "Comedy · Draft" },
  { delay: "0.4s", eyebrow: "Affiliate", title: "Studio ad for the listing", meta: "Image prompt ready" },
  { delay: "0.8s", eyebrow: "YouTube", title: "Thursday title, tags, and hook", meta: "Scheduled" },
];

export function LandingPage({ configured }: { configured: boolean }) {
  return (
    <div className="relative min-h-screen overflow-hidden text-ink">
      <AmbientGlow />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <BrandMark href="/" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="hidden rounded-2xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold shadow-[var(--shadow)] sm:inline-flex">
            Sign in
          </Link>
          <Link
            href={configured ? "/register" : "/dashboard"}
            className="ig-gradient inline-flex rounded-2xl px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow)]"
          >
            {configured ? "Create account" : "Open studio"}
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-16 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pt-16">
        <section>
          <p className="animate-fade-up ig-text text-[11px] font-semibold uppercase tracking-[0.22em]">
            Personal workspace
          </p>
          <h1 className="animate-fade-up mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-6xl" style={{ animationDelay: "90ms" }}>
            Plan the next video before you record it.
          </h1>
          <p className="animate-fade-up mt-5 max-w-xl text-base leading-7 text-muted" style={{ animationDelay: "180ms" }}>
            Keep YouTube and Instagram ideas, thumbnail prompts, captions, and publishing dates in one soft, private studio.
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "270ms" }}>
            <Link
              href={configured ? "/register" : "/dashboard"}
              className="ig-gradient inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-glow)]"
            >
              <Sparkles className="h-4 w-4" />
              {configured ? "Start a workspace" : "Open the studio"}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow)]"
            >
              Sign in
            </Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {features.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="animate-fade-up flex gap-3 rounded-[1.75rem] border border-line bg-surface/80 p-4 shadow-[var(--shadow)] backdrop-blur-xl"
                  style={{ animationDelay: `${360 + index * 80}ms` }}
                >
                  <span className="ig-gradient grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white shadow-[var(--shadow-glow)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-muted">{item.body}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
          <div className="orb orb-pink absolute inset-x-8 top-8 h-64 w-auto" />
          <div className="relative grid gap-4">
            {previewCards.map((card, index) => (
              <article
                key={card.title}
                className="animate-float rounded-[1.75rem] border border-line bg-surface/90 p-5 shadow-[var(--shadow)] backdrop-blur-xl"
                style={{ animationDelay: card.delay, marginLeft: index === 1 ? "1.5rem" : index === 2 ? "0.5rem" : "0" }}
              >
                <p className="ig-text text-[11px] font-semibold uppercase tracking-[0.18em]">{card.eyebrow}</p>
                <p className="mt-2 text-lg font-semibold tracking-tight">{card.title}</p>
                <p className="mt-1 text-sm text-muted">{card.meta}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2 shadow-[var(--shadow-inset)]">
                  <span className="ig-gradient block h-full w-2/3 rounded-full" style={{ width: `${58 + index * 14}%` }} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <p className="relative z-10 mx-auto max-w-6xl px-4 pb-10 text-sm text-muted sm:px-6">
        Malayalam and English. Your rows stay on your account.
      </p>
    </div>
  );
}
