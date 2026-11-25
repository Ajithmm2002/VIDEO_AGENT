"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ComingSoonNotice } from "@/components/coming-soon";
import { ConfirmButton } from "@/components/confirm-button";
import { Button, Card, choiceClass, Field, TextArea, TextInput } from "@/components/ui";
import { deleteMarketplaceListing, fulfillMoneyPurchase, saveMarketplaceListing } from "@/lib/actions/marketplace";
import { formatCoinBalance, formatCoins, priceInCoins } from "@/lib/game-coins";
import { listingKindLabel } from "@/lib/marketplace-catalog";
import { formatSkillPrice } from "@/lib/marketplace-file";
import { cn } from "@/lib/utils";
import { rupeesToPaise } from "@/lib/money";
import type { MarketplaceListing, MarketplacePurchase } from "@/lib/types";

export function AdminShopNav({ current }: { current: "manage" | "list" }) {
  return (
    <nav aria-label="Seller pages" className="mb-6 grid grid-cols-2 gap-2">
      <Link href="/admin/marketplace" className={cn(choiceClass(current === "manage"), "justify-center")}>
        Manage products
      </Link>
      <Link href="/admin/marketplace/new" className={cn(choiceClass(current === "list"), "justify-center")}>
        List a product
      </Link>
    </nav>
  );
}

export function MarketplaceProductManager({
  listings,
  pending,
  editId = null,
}: {
  listings: MarketplaceListing[];
  pending: MarketplacePurchase[];
  editId?: string | null;
}) {
  const router = useRouter();
  const titles = new Map(listings.map((item) => [item.id, item.title]));
  const editing = editId ? listings.find((item) => item.id === editId) ?? null : null;

  if (editing) {
    return (
      <div className="grid gap-6">
        <AdminShopNav current="manage" />
        <MarketplaceListingForm listing={editing} layout="edit" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <AdminShopNav current="manage" />
      {editId ? (
        <Card>
          <p className="text-sm text-muted">That product is not in this list. It may have been deleted.</p>
        </Card>
      ) : null}
      {pending.length ? (
        <Card className="grid gap-3">
          <h2 className="font-semibold">Rupee payments to confirm</h2>
          {pending.map((item) => (
            <div
              key={`${item.listing_id}-${item.buyer_id}`}
              className="grid gap-3 rounded-xl border border-line bg-surface-2/70 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{titles.get(item.listing_id) ?? "Product"}</p>
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

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h2 className="font-semibold">Current products</h2>
            <p className="mt-0.5 text-sm text-muted">
              {listings.length ? `${listings.length} ${listings.length === 1 ? "listing" : "listings"}` : "Nothing listed yet"}
            </p>
          </div>
          <Link
            href="/admin/marketplace/new"
            className="bg-accent inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-accent-ink"
          >
            List a product
          </Link>
        </div>
        {listings.length ? (
          <ul className="divide-y divide-line">
            {listings.map((listing) => (
              <li key={listing.id}>
                <AdminProductRow
                  listing={listing}
                  onDeleted={() => {
                    router.refresh();
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid gap-3 px-4 py-8 text-center">
            <p className="text-sm text-muted">No products yet. Listing a product is a separate page from this list.</p>
            <Link
              href="/admin/marketplace/new"
              className="bg-accent mx-auto inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold text-accent-ink"
            >
              List a product
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function AdminProductRow({ listing, onDeleted }: { listing: MarketplaceListing; onDeleted: () => void }) {
  const coins = listing.price_paise > 0 ? formatCoins(priceInCoins(listing.price_paise)) : "Free";
  const actionClass =
    "min-h-11 w-full min-w-0 rounded-none border-0 shadow-none";

  return (
    <article className="grid">
      <div className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_6.5rem_9rem] md:items-center">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            {listing.listed ? "Listed" : "Draft"} · {listingKindLabel(listing.kind)}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold leading-6">{listing.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted">{listing.description}</p>
        </div>
        <div className="flex items-baseline justify-between gap-4 md:contents">
          <p className="shrink-0 text-sm font-semibold tabular-nums md:text-right">{formatSkillPrice(listing.price_paise)}</p>
          <p className="shrink-0 text-sm text-muted md:text-right">
            {listing.price_paise > 0 ? `🪙 ${coins}` : "No coins"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-line">
        {listing.file_ext ? (
          <a
            href={`/api/marketplace/download?id=${listing.id}`}
            className="grid min-h-11 place-items-center border-r border-line text-sm font-semibold"
          >
            Download
          </a>
        ) : (
          <span className="grid min-h-11 place-items-center border-r border-line text-sm text-muted">No file</span>
        )}
        <Link
          href={`/admin/marketplace?edit=${listing.id}`}
          className="grid min-h-11 place-items-center border-r border-line text-sm font-semibold"
        >
          Edit
        </Link>
        <ConfirmButton
          label="Delete"
          title="Delete this listing?"
          message="This removes the shop listing and the uploaded file."
          confirmLabel="Delete listing"
          className={actionClass}
          onConfirm={async () => {
            const result = await deleteMarketplaceListing(listing.id);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Listing removed");
            onDeleted();
          }}
        />
      </div>
    </article>
  );
}

export function MarketplaceListingForm({
  listing,
  layout = listing ? "edit" : "create",
}: {
  listing?: MarketplaceListing | null;
  layout?: "create" | "edit";
}) {
  const router = useRouter();
  const editing = layout === "edit";
  const [pending, setPending] = useState(false);
  const [kind, setKind] = useState(listing?.kind ?? "skill");
  const [priceText, setPriceText] = useState(listing ? String(listing.price_paise / 100) : "0");
  const paise = rupeesToPaise(priceText);
  const coinsNeeded = paise == null ? null : priceInCoins(paise);

  return (
    <div className="grid gap-6">
      {editing ? null : <AdminShopNav current="list" />}
      <Card className="mx-auto w-full max-w-xl">
        <h2 className="font-semibold">{editing ? `Edit “${listing?.title ?? "product"}”` : "List a product"}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          {editing
            ? "You are updating this product. Saving does not create a new listing. Leave the file empty to keep the current upload."
            : "Upload a .md skill or a .zip digital product and set the rupee price only. Coin cost is an in-app shop price (100 coins per ₹1 on the tag). Coins cannot be cashed out or transferred."}
        </p>
        {editing && listing ? (
          <p className="mt-3 text-sm text-muted">
            {listing.listed ? "Listed" : "Draft"} · {listingKindLabel(listing.kind)} · {formatSkillPrice(listing.price_paise)}
            {listing.file_name ? ` · Current file: ${listing.file_name}` : ""}
          </p>
        ) : null}
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
              router.push("/admin/marketplace");
              router.refresh();
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
                <button key={value} type="button" className={choiceClass(kind === value)} onClick={() => setKind(value)}>
                  {value === "skill" ? "Skill" : "Digital product"}
                </button>
              ))}
            </div>
            <input type="hidden" name="kind" value={kind} />
          </div>
          <Field
            label="Selling price (INR)"
            hint="Enter rupees only. 0 is free. Coin cost is an in-app shop price (100 coins per ₹1 on the tag), not a cash payout. You never enter coins."
          >
            <TextInput
              name="price"
              inputMode="decimal"
              value={priceText}
              onChange={(event) => setPriceText(event.target.value)}
            />
          </Field>
          <p className="rounded-md border border-line bg-surface-2/80 px-3 py-2 text-sm">
            {paise == null
              ? "Enter a rupee amount such as 99 or 99.50."
              : paise <= 0
                ? "This listing will be free. No coins required."
                : `Buyers need ${formatCoinBalance(coinsNeeded ?? 0)} or ${formatSkillPrice(paise)}.`}
          </p>
          <Field
            label="Skill file"
            hint={
              editing
                ? "Optional. Leave empty to keep the current file. Accepts .md or .zip."
                : "Required. .md for one skill, .zip for a bundle."
            }
          >
            <input
              name="file"
              type="file"
              accept=".md,.markdown,.zip,text/markdown,application/zip"
              required={!listing}
              className="block w-full text-sm"
            />
          </Field>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="listed" defaultChecked={listing?.listed ?? true} />
            List this in the shop
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/admin/marketplace"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-surface px-3 text-sm font-semibold"
            >
              {editing ? "Cancel" : "Back to manage"}
            </Link>
            <Button type="submit" loading={pending} className="w-full">
              {pending ? "Saving…" : editing ? "Save changes" : "Publish listing"}
            </Button>
          </div>
        </form>
      </Card>
      {editing ? null : (
      <div className="mx-auto grid w-full max-w-xl gap-3">
        <ComingSoonNotice
          title="Image samples"
          body="A later version will let you attach preview screenshots of the skill. Buyers will see those before they pay."
        />
        <ComingSoonNotice
          title="Community seller uploads"
          body="Only this admin desk can list skills today. A later version will let other people submit their own .md files."
        />
      </div>
      )}
    </div>
  );
}
