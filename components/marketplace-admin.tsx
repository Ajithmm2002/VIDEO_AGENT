"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ComingSoonNotice } from "@/components/coming-soon";
import { ConfirmButton } from "@/components/confirm-button";
import { Button, Card, choiceClass, Field, TextArea, TextInput } from "@/components/ui";
import { deleteMarketplaceListing, fulfillMoneyPurchase, saveMarketplaceListing } from "@/lib/actions/marketplace";
import { formatCoinBalance, priceInCoins } from "@/lib/game-coins";
import { formatSkillPrice } from "@/lib/marketplace-file";
import { rupeesToPaise } from "@/lib/validation";
import type { MarketplaceListing, MarketplacePurchase } from "@/lib/types";

export function MarketplaceAdmin({
  listings,
  pending,
}: {
  listings: MarketplaceListing[];
  pending: MarketplacePurchase[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<MarketplaceListing | null>(null);
  const titles = new Map(listings.map((item) => [item.id, item.title]));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <h2 className="font-semibold">{editing ? "Edit listing" : "List a skill"}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Upload a .md skill or a .zip bundle and set the rupee price only. Coin cost for buyers is calculated automatically (10 coins = ₹1).
        </p>
        <ListingForm
          key={editing?.id ?? "new"}
          listing={editing}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
        <div className="mt-5 grid gap-3">
          <ComingSoonNotice
            title="Image samples"
            body="A later version will let you attach preview screenshots of the skill. Buyers will see those before they pay."
          />
          <ComingSoonNotice
            title="Community seller uploads"
            body="Only this admin desk can list skills today. A later version will let other people submit their own .md files."
          />
        </div>
      </Card>
      <div className="grid gap-3">
        {pending.length ? (
          <Card className="grid gap-3">
            <h2 className="font-semibold">Rupee payments to confirm</h2>
            {pending.map((item) => (
              <div key={`${item.listing_id}-${item.buyer_id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface-2/70 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">{titles.get(item.listing_id) ?? "Skill"}</p>
                  <p className="text-xs text-muted">{formatSkillPrice(item.amount_paise)} · waiting</p>
                </div>
                {item.buyer_id ? (
                  <ConfirmButton
                    label="Mark paid"
                    title="Confirm this rupee payment?"
                    message="This unlocks the download for that buyer."
                    confirmLabel="Mark paid"
                    onConfirm={async () => {
                      const result = await fulfillMoneyPurchase(item.listing_id, item.buyer_id as string);
                      if (!result.ok) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success(result.message ?? "Marked paid");
                      router.refresh();
                    }}
                  />
                ) : null}
              </div>
            ))}
          </Card>
        ) : null}
        {listings.length ? listings.map((listing) => (
          <Card key={listing.id} className="grid gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {listing.listed ? "Listed" : "Draft"} · {listing.kind}
                </p>
                <h3 className="mt-1 truncate font-semibold">{listing.title}</h3>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">{formatSkillPrice(listing.price_paise)}</p>
                {listing.price_paise > 0 ? (
                  <p className="mt-0.5 text-xs text-muted">{formatCoinBalance(priceInCoins(listing.price_paise))} for buyers</p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted">Free</p>
                )}
              </div>
            </div>
            <p className="line-clamp-2 text-sm text-muted">{listing.description}</p>
            <div className="flex flex-wrap gap-2">
              {listing.file_ext ? (
                <a
                  href={`/api/marketplace/download?id=${listing.id}`}
                  className="inline-flex items-center rounded-2xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold shadow-[var(--shadow)]"
                >
                  Download
                </a>
              ) : null}
              <Button variant="secondary" onClick={() => setEditing(listing)}>Edit</Button>
              <ConfirmButton
                label="Delete"
                title="Delete this listing?"
                message="This removes the shop listing and the uploaded file."
                confirmLabel="Delete listing"
                onConfirm={async () => {
                  const result = await deleteMarketplaceListing(listing.id);
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  if (editing?.id === listing.id) setEditing(null);
                  toast.success("Listing removed");
                  router.refresh();
                }}
              />
            </div>
          </Card>
        )) : (
          <Card>
            <p className="text-sm text-muted">No listings yet. Upload the first skill on the left.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function ListingForm({
  listing,
  onSaved,
}: {
  listing: MarketplaceListing | null;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [kind, setKind] = useState(listing?.kind ?? "skill");
  const [priceText, setPriceText] = useState(listing ? String(listing.price_paise / 100) : "0");
  const paise = rupeesToPaise(priceText);
  const coinsNeeded = paise == null ? null : priceInCoins(paise);

  return (
    <form
      className="mt-5 grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        setPending(true);
        try {
          const result = await saveMarketplaceListing(data);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(result.message ?? "Saved");
          form.reset();
          setPriceText("0");
          onSaved();
        } finally {
          setPending(false);
        }
      }}
    >
      {listing ? <input type="hidden" name="id" value={listing.id} /> : null}
      <Field label="Title">
        <TextInput name="title" required maxLength={120} defaultValue={listing?.title ?? ""} />
      </Field>
      <Field label="Description" hint="Buyers read this before they pay. Do not paste the full skill file here.">
        <TextArea name="description" required minLength={20} maxLength={8000} defaultValue={listing?.description ?? ""} />
      </Field>
      <Field label="Offerings" hint="One item per line. Example: Ready-to-paste Claude skill, Usage notes, Prompt checklist.">
        <TextArea name="offerings" maxLength={800} defaultValue={listing?.offerings.join("\n") ?? ""} />
      </Field>
      <div>
        <p className="mb-1.5 text-sm font-medium">Type</p>
        <div className="flex flex-wrap gap-2">
          {(["skill", "bundle"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={choiceClass(kind === value)}
              onClick={() => setKind(value)}
            >
              {value === "skill" ? "Single skill" : "Bundle"}
            </button>
          ))}
        </div>
        <input type="hidden" name="kind" value={kind} />
      </div>
      <Field
        label="Selling price (INR)"
        hint="Enter rupees only. 0 is free. Coin cost is calculated for buyers at 10 coins = ₹1. You never enter coins."
      >
        <TextInput
          name="price"
          inputMode="decimal"
          value={priceText}
          onChange={(event) => setPriceText(event.target.value)}
        />
      </Field>
      <p className="rounded-2xl border border-line bg-surface-2/80 px-3 py-2 text-sm shadow-[var(--shadow-inset)]">
        {paise == null
          ? "Enter a rupee amount such as 99 or 99.50."
          : paise <= 0
            ? "This listing will be free. No coins required."
            : `Buyers need ${formatCoinBalance(coinsNeeded ?? 0)} or ${formatSkillPrice(paise)}.`}
      </p>
      <Field label="Skill file" hint={listing ? "Leave empty to keep the current file. Accepts .md or .zip." : "Required. .md for one skill, .zip for a bundle."}>
        <input
          name="file"
          type="file"
          accept=".md,.markdown,.zip,text/markdown,application/zip"
          required={!listing}
          className="block w-full text-sm"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="listed" defaultChecked={listing?.listed ?? true} />
        List this in the shop
      </label>
      <Button type="submit" loading={pending}>{pending ? "Saving…" : listing ? "Update listing" : "Publish listing"}</Button>
    </form>
  );
}
