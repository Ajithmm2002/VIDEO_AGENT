export default function ProductLoading() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div className="aspect-square animate-pulse rounded-2xl bg-surface-2/80" />
      <div className="grid gap-3">
        <div className="h-8 max-w-sm animate-pulse rounded-md bg-surface-2/80" />
        <div className="h-24 animate-pulse rounded-md bg-surface-2/70" />
        <div className="h-32 animate-pulse rounded-md bg-surface-2/80" />
      </div>
    </div>
  );
}
