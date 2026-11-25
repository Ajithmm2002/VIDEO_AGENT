/** Brand deal pipeline: types, stages, and totals. */

export const dealStatuses = ["pitch", "negotiating", "agreed", "delivered", "paid", "lost"] as const;
export type DealStatus = (typeof dealStatuses)[number];

export const dealStatusLabels: Record<DealStatus, string> = {
  pitch: "Pitched",
  negotiating: "Negotiating",
  agreed: "Agreed",
  delivered: "Delivered",
  paid: "Paid",
  lost: "Lost",
};

export const dealStatusColors: Record<DealStatus, string> = {
  pitch: "var(--muted)",
  negotiating: "var(--warn)",
  agreed: "var(--info)",
  delivered: "var(--accent)",
  paid: "var(--ok)",
  lost: "var(--danger)",
};

export type BrandDeal = {
  id: string;
  brand: string;
  status: DealStatus;
  amount_paise: number | null;
  due_date: string | null;
  deliverables: string | null;
  contact: string | null;
  notes: string | null;
  updated_at: string;
};

export type BrandDealInput = Omit<BrandDeal, "id" | "updated_at">;

function textOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export function asBrandDeal(value: unknown): BrandDeal | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.brand !== "string") return null;
  const status = (dealStatuses as readonly string[]).includes(String(row.status)) ? (row.status as DealStatus) : "pitch";
  const amount = typeof row.amount_paise === "number" ? row.amount_paise : typeof row.amount_paise === "string" ? Number(row.amount_paise) : null;
  return {
    id: row.id,
    brand: row.brand,
    status,
    amount_paise: amount != null && Number.isFinite(amount) ? amount : null,
    due_date: textOrNull(row.due_date),
    deliverables: textOrNull(row.deliverables),
    contact: textOrNull(row.contact),
    notes: textOrNull(row.notes),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

export function dealTotals(deals: BrandDeal[], today: string) {
  const open = deals.filter((deal) => deal.status !== "paid" && deal.status !== "lost");
  const monthPrefix = today.slice(0, 7);
  return {
    openCount: open.length,
    pipelinePaise: open.reduce((sum, deal) => sum + (deal.amount_paise ?? 0), 0),
    paidThisMonthPaise: deals
      .filter((deal) => deal.status === "paid" && deal.updated_at.slice(0, 7) === monthPrefix)
      .reduce((sum, deal) => sum + (deal.amount_paise ?? 0), 0),
    overdue: open.filter((deal) => deal.due_date && deal.due_date < today && deal.status !== "delivered").length,
  };
}

export function formatRupees(paise: number | null) {
  if (paise == null) return "—";
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
