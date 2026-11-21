export default function SkillLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
      <div className="grid gap-2">
        <div className="h-16 animate-pulse rounded-2xl bg-surface-2/80" />
        <div className="h-16 animate-pulse rounded-2xl bg-surface-2/70" />
        <div className="h-16 animate-pulse rounded-2xl bg-surface-2/80" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-surface-2/80" />
    </div>
  );
}
