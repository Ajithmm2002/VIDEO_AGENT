export function rupeesToPaise(value: string) {
  const trimmed = value.trim().replace(/[₹,\s]/g, "");
  if (!trimmed) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}
