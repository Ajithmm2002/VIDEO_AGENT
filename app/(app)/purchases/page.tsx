import type { Metadata } from "next";
import { MyPurchases } from "@/components/my-purchases";
import { PageHeader } from "@/components/ui";
import { listMyPurchaseItems } from "@/lib/queries";

export const metadata: Metadata = { title: "Purchases" };

export default async function PurchasesPage() {
  const records = await listMyPurchaseItems();

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Purchases"
        description="Files you bought in the marketplace stay here. Download them any time. The marketplace itself is only for buying and selling."
      />
      <MyPurchases records={records} />
    </div>
  );
}
