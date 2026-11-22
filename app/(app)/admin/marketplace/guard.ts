import { redirect } from "next/navigation";
import { isMarketplaceAdmin, isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser, requestUserEmail } from "@/lib/session";

export async function requireShopAdmin() {
  if (!isSupabaseConfigured()) redirect("/marketplace");
  const [email, user] = await Promise.all([requestUserEmail(), getCurrentUser()]);
  if (!isMarketplaceAdmin(email ?? user?.email)) redirect("/marketplace");
}
