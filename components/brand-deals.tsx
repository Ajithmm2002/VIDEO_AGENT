"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Briefcase, CalendarDays, Plus } from "lucide-react";
import { deleteBrandDeal, saveBrandDeal, setBrandDealStatus } from "@/lib/actions/creator";
import { ConfirmButton } from "@/components/confirm-button";
import { Button, Card, EmptyState, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import {
  dealStatusColors,
  dealStatusLabels,
  dealStatuses,
  dealTotals,
  formatRupees,
  type BrandDeal,
  type BrandDealInput,
  type DealStatus,
} from "@/lib/brand-deals";
import { rupeesToPaise } from "@/lib/money";
import { formatDate } from "@/lib/utils";

const EMPTY: BrandDealInput = { brand: "", status: "pitch", amount_paise: null, due_date: null, deliverables: null, contact: null, notes: null };

function DealForm({ deal, onDone }: { deal: BrandDeal | null; onDone: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<BrandDealInput>(deal ? { ...deal } : EMPTY);
  const [amount, setAmount] = useState(deal?.amount_paise != null ? String(deal.amount_paise / 100) : "");
  const [saving, setSaving] = useState(false);
  const patch = (partial: Partial<BrandDealInput>) => setForm((current) => ({ ...current, ...partial }));

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const paise = amount.trim() ? rupeesToPaise(amount) : null;
        if (amount.trim() && paise == null) return toast.error("Enter the amount in rupees, for example 15000.");
        setSaving(true);
        const result = await saveBrandDeal(deal?.id ?? null, { ...form, amount_paise: paise });
        setSaving(false);
        if (!result.ok) return toast.error(result.error);
        toast.success(result.message ?? "Saved");
        onDone();
        router.refresh();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand">
          <TextInput value={form.brand} onChange={(event) => patch({ brand: event.target.value })} required maxLength={80} autoFocus />
        </Field>
        <Field label="Stage">
          <SelectInput value={form.status} onChange={(event) => patch({ status: event.target.value as DealStatus })}>
            {dealStatuses.map((status) => (
              <option key={status} value={status}>
                {dealStatusLabels[status]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Amount (₹)" hint="Leave empty for barter or unknown.">
          <TextInput value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="15000" />
        </Field>
        <Field label="Due date">
          <TextInput type="date" value={form.due_date ?? ""} onChange={(event) => patch({ due_date: event.target.value || null })} />
        </Field>
      </div>
      <Field label="Deliverables" hint="For example: 1 reel + 2 stories, link in bio for 7 days.">
        <TextArea value={form.deliverables ?? ""} onChange={(event) => patch({ deliverables: event.target.value || null })} maxLength={1000} className="min-h-20" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact" hint="Name, email, or phone of the brand or agency.">
          <TextInput value={form.contact ?? ""} onChange={(event) => patch({ contact: event.target.value || null })} maxLength={200} />
        </Field>
        <Field label="Notes">
          <TextInput value={form.notes ?? ""} onChange={(event) => patch({ notes: event.target.value || null })} maxLength={2000} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={saving}>
          {deal ? "Save deal" : "Add deal"}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function DealRow({ deal, today, onEdit }: { deal: BrandDeal; today: string; onEdit: () => void }) {
  const router = useRouter();
  const overdue = deal.due_date && deal.due_date < today && !["delivered", "paid", "lost"].includes(deal.status);
  return (
    <li className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <button type="button" className="min-w-0 text-left" onClick={onEdit}>
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{deal.brand}</span>
          <span className="text-sm font-semibold tabular-nums">{formatRupees(deal.amount_paise)}</span>
          {overdue ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              Overdue
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          {deal.due_date ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Due {formatDate(deal.due_date)}
            </span>
          ) : null}
          {deal.deliverables ? <span className="truncate">{deal.deliverables}</span> : null}
        </span>
      </button>
      <div className="flex items-center gap-2">
        <SelectInput
          aria-label={`Stage for ${deal.brand}`}
          value={deal.status}
          className="w-40"
          style={{ color: dealStatusColors[deal.status] }}
          onChange={async (event) => {
            const result = await setBrandDealStatus(deal.id, event.target.value as DealStatus);
            if (!result.ok) return toast.error(result.error);
            router.refresh();
          }}
        >
          {dealStatuses.map((status) => (
            <option key={status} value={status}>
              {dealStatusLabels[status]}
            </option>
          ))}
        </SelectInput>
        <ConfirmButton
          label="Delete"
          title={`Delete the ${deal.brand} deal?`}
          message="This removes the deal and its notes. It cannot be undone."
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          onConfirm={async () => {
            const result = await deleteBrandDeal(deal.id);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(result.message ?? "Deleted");
            router.refresh();
          }}
        />
      </div>
    </li>
  );
}

export function BrandDeals({ deals, today, configured, missing }: { deals: BrandDeal[]; today: string; configured: boolean; missing: boolean }) {
  const [editing, setEditing] = useState<BrandDeal | "new" | null>(null);
  const [filter, setFilter] = useState<"open" | "all" | DealStatus>("open");
  const totals = dealTotals(deals, today);
  const shown = deals.filter((deal) =>
    filter === "all" ? true : filter === "open" ? deal.status !== "paid" && deal.status !== "lost" : deal.status === filter,
  );

  if (missing) {
    return (
      <Card>
        <p className="text-sm leading-6 text-warn">Run the creator tools SQL (20261126120000_creator_tools.sql) in Supabase to turn on brand deals.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Open deals", value: String(totals.openCount) },
          { label: "Open pipeline value", value: formatRupees(totals.pipelinePaise) },
          { label: "Marked paid this month", value: formatRupees(totals.paidThisMonthPaise) },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 sm:p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{stat.value}</p>
          </Card>
        ))}
      </div>

      {editing ? (
        <Card>
          <h2 className="mb-4 font-semibold">{editing === "new" ? "New deal" : `Edit ${editing.brand}`}</h2>
          <DealForm key={editing === "new" ? "new" : editing.id} deal={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SelectInput aria-label="Show deals" value={filter} className="w-44" onChange={(event) => setFilter(event.target.value as typeof filter)}>
              <option value="open">Open deals</option>
              <option value="all">All deals</option>
              {dealStatuses.map((status) => (
                <option key={status} value={status}>
                  {dealStatusLabels[status]}
                </option>
              ))}
            </SelectInput>
            {totals.overdue ? <span className="text-sm font-medium text-danger">{totals.overdue} overdue</span> : null}
          </div>
          <Button disabled={!configured} onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" aria-hidden />
            New deal
          </Button>
        </div>
        {shown.length ? (
          <ul className="mt-2 divide-y divide-line">
            {shown.map((deal) => (
              <DealRow key={deal.id} deal={deal} today={today} onEdit={() => setEditing(deal)} />
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState
              title={deals.length ? "No deals in this view" : "No brand deals yet"}
              body={deals.length ? "Change the filter to see other deals." : "Add your first pitch to keep track of amounts, deliverables, and due dates."}
              action={
                deals.length ? undefined : (
                  <Button disabled={!configured} onClick={() => setEditing("new")}>
                    <Briefcase className="h-4 w-4" aria-hidden />
                    Add a deal
                  </Button>
                )
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
}
