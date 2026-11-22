import { redirect } from "next/navigation";
import { requireShopAdmin } from "@/app/(app)/admin/marketplace/guard";

export default async function EditMarketplaceListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireShopAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/marketplace");
  redirect(`/admin/marketplace?edit=${id}`);
}
