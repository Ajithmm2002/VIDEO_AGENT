export function formatListingPrice(amount: unknown, currency = "") {
  const numeric = typeof amount === "number" ? amount : Number(String(amount ?? "").replace(/,/g, "").trim());
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 10_000_000) {
    const raw = String(amount ?? "").trim();
    return /^[₹$€£]/.test(raw) ? raw.slice(0, 40) : "";
  }
  const rounded = Number.isInteger(numeric) ? String(Math.round(numeric)) : numeric.toFixed(2).replace(/\.00$/, "");
  const code = currency.trim().toUpperCase().replace(/[^A-Z₹$€£]/g, "");
  if (!code || code === "INR" || code === "RS" || code === "₹") return `₹${rounded}`;
  if (code === "USD" || code === "$") return `$${rounded}`;
  if (code === "EUR" || code === "€") return `€${rounded}`;
  if (code === "GBP" || code === "£") return `£${rounded}`;
  return `${rounded} ${code}`.trim();
}

export function normalizeListingPrice(value: string) {
  const trimmed = value.trim().slice(0, 40);
  if (!trimmed) return "";
  const compact = trimmed.replace(/\s+/g, " ");
  if (/^[₹$€£][\d,.]+$/.test(compact.replace(/\s/g, ""))) {
    return compact.replace(/\s/g, "");
  }
  const rupees = /^(?:rs\.?|inr)\s*([\d,.]+)$/i.exec(compact);
  if (rupees) return formatListingPrice(rupees[1], "INR");
  if (/^[\d,.]+$/.test(compact)) return formatListingPrice(compact, "INR");
  return "";
}

export function priceFromPreviewText(value: string) {
  const match = value.match(/[₹$€£]\s*[\d,]+(?:\.\d{1,2})?/);
  return match ? normalizeListingPrice(match[0]) || match[0].replace(/\s+/g, "") : "";
}
