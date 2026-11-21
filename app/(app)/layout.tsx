import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { isMarketplaceAdmin, isSupabaseConfigured } from "@/lib/env";
import { getGameWallet } from "@/lib/queries";
import { requestUserEmail } from "@/lib/session";

export const maxDuration = 60;

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [email, wallet] = await Promise.all([
    configured ? requestUserEmail() : Promise.resolve(null),
    configured ? getGameWallet() : Promise.resolve({ coins: 0, earned: 0 }),
  ]);

  return (
    <AppShell email={email} configured={configured} isAdmin={isMarketplaceAdmin(email)} coins={wallet.coins} earned={wallet.earned}>
      {children}
    </AppShell>
  );
}
