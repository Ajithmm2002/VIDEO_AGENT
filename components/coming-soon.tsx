export function ComingSoonNotice({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface-2/70 p-4 shadow-[var(--shadow-inset)]">
      <p className="text-accent text-[11px] font-semibold uppercase tracking-[0.18em]">Coming soon</p>
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}
