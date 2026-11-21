export function formatListingPrice(amount: unknown, currency = "") {
  if (amount == null || amount === "") return "";
  const numeric = typeof amount === "number" ? amount : Number(String(amount).replace(/,/g, "").trim());
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

export function cleanListingTitle(value: string) {
  return value
    .replace(/\s*[|\-–:]\s*(?:Amazon\.in|Amazon|Flipkart|Meesho|Myntra).*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

export function priceFromJsonData(node: unknown): string {
  if (node == null) return "";
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = priceFromJsonData(item);
      if (found) return found;
    }
    return "";
  }
  if (typeof node !== "object") return "";
  const row = node as Record<string, unknown>;
  if (row["@graph"]) {
    const found = priceFromJsonData(row["@graph"]);
    if (found) return found;
  }
  if (row.offers) {
    const found = priceFromJsonData(row.offers);
    if (found) return found;
  }
  const amount = row.price ?? row.lowPrice ?? row.discounted_price;
  if (amount != null && amount !== "") {
    const formatted = formatListingPrice(amount, String(row.priceCurrency ?? row.currency ?? ""));
    if (formatted) return formatted;
  }
  return "";
}
