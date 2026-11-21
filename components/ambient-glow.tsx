export function AmbientGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <span className="orb orb-pink -left-24 -top-16 h-80 w-80 animate-ig-drift" />
      <span className="orb orb-warm right-[-5rem] top-24 h-72 w-72 animate-ig-drift-slow" />
      <span className="orb orb-cool bottom-[-4rem] left-1/3 h-64 w-64 animate-float" />
    </div>
  );
}
