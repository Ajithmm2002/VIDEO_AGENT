import { COIN_REWARD_HEADLINE, COIN_REWARD_SUMMARY, COIN_REWARD_TERMS } from "@/lib/game-coins";

export function CoinRewardNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs leading-5 text-muted">
        {COIN_REWARD_HEADLINE} {COIN_REWARD_SUMMARY}
      </p>
    );
  }

  return (
    <aside className="rounded-xl border border-line bg-surface-2/80 p-4 text-sm shadow-[var(--shadow-inset)]">
      <p className="font-semibold">{COIN_REWARD_HEADLINE}</p>
      <p className="mt-1 leading-6 text-muted">{COIN_REWARD_SUMMARY}</p>
      <ul className="mt-3 grid gap-1.5 text-xs leading-5 text-muted">
        {COIN_REWARD_TERMS.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </aside>
  );
}
