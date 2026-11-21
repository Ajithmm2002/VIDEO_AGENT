export default function SkillLoading() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="h-5 w-16 animate-pulse rounded-full bg-surface-2/80" />
      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
        <div className="h-24 animate-pulse bg-surface-2/80" />
        <div className="grid gap-3 p-5">
          <div className="h-3 w-14 animate-pulse rounded-full bg-surface-2/80" />
          <div className="h-7 w-2/3 animate-pulse rounded-xl bg-surface-2/80" />
          <div className="h-16 animate-pulse rounded-xl bg-surface-2/70" />
          <div className="h-10 animate-pulse rounded-2xl bg-surface-2/80" />
        </div>
      </div>
    </div>
  );
}
