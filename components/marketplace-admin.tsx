"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ComingSoonNotice } from "@/components/coming-soon";
import { ConfirmButton } from "@/components/confirm-button";
import { Button, Card, choiceClass, Field, TextArea, TextInput } from "@/components/ui";
import { deleteMarketplaceListing, saveMarketplaceListing } from "@/lib/actions/marketplace";
import { formatSkillPrice } from "@/lib/marketplace-file";
import type { MarketplaceListing } from "@/lib/types";

export function MarketplaceAdmin({
  listings,
  adminEmail,
}: {
  listings: MarketplaceListing[];
  adminEmail: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<MarketplaceListing | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <h2 className="font-semibold">{editing ? "Edit listing" : "List a skill"}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Upload one Claude or LLM skill as a .md file, or a bundle as a .zip. Set the price and what the buyer gets.
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
        <Card className="text-sm leading-6 text-muted">
          If a save fails, run this once in the Supabase SQL editor, using the signed-in shop email:
          <pre className="mt-2 overflow-x-auto rounded-2xl bg-surface-2 p-3 text-xs text-ink shadow-[var(--shadow-inset)]">
            {`insert into public.app_admins (email) values ('${adminEmail.replace(/'/g, "''")}');\n`}
          </pre>
        </Card>
        {listings.length ? listings.map((listing) => (
          <Card key={listing.id} className="grid gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {listing.listed ? "Listed" : "Draft"} · {listing.kind} · {formatSkillPrice(listing.price_paise)}
              </p>
              <h3 className="mt-1 font-semibold">{listing.title}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-muted">{listing.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
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
  const rupees = listing ? (listing.price_paise / 100).toString() : "0";

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
      <Field label="Selling price (INR)" hint="Use 0 to let people take it for free. Paid checkout is coming soon.">
        <TextInput name="price" inputMode="decimal" defaultValue={rupees} />
      </Field>
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
