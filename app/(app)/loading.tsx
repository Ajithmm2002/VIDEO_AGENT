export default function Loading() {
  return (
    <div className="grid gap-4">
      <div className="h-16 max-w-md animate-pulse rounded-xl bg-surface-2/80" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-surface/80" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-surface/80" />
    </div>
  );
}
