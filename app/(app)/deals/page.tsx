import type { Metadata } from "next";
import { BrandDeals } from "@/components/brand-deals";
import { PageHeader } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { listBrandDeals } from "@/lib/queries";

export const metadata: Metadata = { title: "Brand deals" };

function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default async function DealsPage() {
  const { deals, missing } = await listBrandDeals();
  return (
    <div>
      <PageHeader
        eyebrow="Grow"
        title="Brand deals"
        description="Track sponsorships from first pitch to payment: amount, deliverables, due date, and contact, all in one place."
      />
      <BrandDeals deals={deals} today={todayInIndia()} configured={isSupabaseConfigured()} missing={missing} />
    </div>
  );
}
