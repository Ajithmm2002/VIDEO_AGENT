import Link from "next/link";
import { shopPaths } from "@/lib/coin-packs";

export function ShopPaths() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {shopPaths.map((item, index) => (
        <div key={item.title} className="rounded-2xl border border-line bg-surface/90 p-3 shadow-[var(--shadow)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {index + 1 < 10 ? `0${index + 1}` : index + 1}
          </p>
          <p className="mt-1 text-sm font-semibold">{item.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{item.body}</p>
          {item.title === "Earn coins" ? (
            <Link href="/play" className="mt-2 inline-block text-xs font-semibold text-accent">
              Play Fun mode
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}
