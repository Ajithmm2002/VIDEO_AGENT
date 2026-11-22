import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, Gamepad2, ImageIcon, Sparkles, Store } from "lucide-react";

const chips = [
  { icon: Sparkles, label: "Ideas", href: "/planner" },
  { icon: ImageIcon, label: "Prompts", href: "/thumbnails" },
  { icon: CalendarDays, label: "Calendar", href: "/calendar" },
  { icon: Store, label: "Marketplace", href: "/marketplace" },
  { icon: Gamepad2, label: "Fun mode", href: "/play" },
];

export function DashboardWelcome({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="billboard rounded-md px-5 py-8 sm:px-8 sm:py-12">
        <p className="ig-text text-[11px] font-semibold uppercase tracking-[0.22em]">{eyebrow}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p>
          </div>
          {action}
        </div>
      </div>
      <div className="media-row mt-4">
        {chips.map((chip) => {
          const Icon = chip.icon;
          return (
            <Link
              key={chip.label}
              href={chip.href}
              className="inline-flex min-h-11 min-w-[9.5rem] items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold"
            >
              <span className="ig-gradient grid h-7 w-7 place-items-center rounded-md text-white">
                <Icon className="h-3.5 w-3.5" />
              </span>
              {chip.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
