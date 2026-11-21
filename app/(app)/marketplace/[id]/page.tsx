import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComingSoonNotice } from "@/components/coming-soon";
import { MarketplaceBuy } from "@/components/marketplace-browser";
import { Card, PageHeader } from "@/components/ui";
import { formatSkillPrice } from "@/lib/marketplace-file";
import { getMarketplaceListing, listMyPurchases } from "@/lib/queries";

export const metadata: Metadata = { title: "Skill" };

export default async function MarketplaceListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getMarketplaceListing(id);
  if (!listing || !listing.listed) notFound();
  const purchases = await listMyPurchases();
  const purchase = purchases.find((item) => item.listing_id === listing.id);

  return (
    <div>
      <PageHeader
        eyebrow={listing.kind === "bundle" ? "Bundle" : "Skill"}
        title={listing.title}
        description={`${formatSkillPrice(listing.price_paise)} · ${listing.file_ext === "zip" ? "ZIP bundle" : "Markdown skill"}`}
        action={
          <Link href="/marketplace" className="rounded-2xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold shadow-[var(--shadow)]">
            Back to shop
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="grid gap-4">
          <ComingSoonNotice title="Preview images" body="Screenshots of this skill will appear here in a later version." />
          <p className="whitespace-pre-wrap text-sm leading-7">{listing.description}</p>
          {listing.offerings.length ? (
            <div>
              <h2 className="font-semibold">What you get</h2>
              <ul className="mt-2 grid gap-1 text-sm text-muted">
                {listing.offerings.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
        <MarketplaceBuy listing={listing} purchase={purchase} />
      </div>
    </div>
  );
}
