import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { isMarketplaceAdmin, isSupabaseConfigured } from "@/lib/env";
import { getGameWallet, getProfile } from "@/lib/queries";
import { requestUserEmail } from "@/lib/session";
import { accountLabel } from "@/lib/account-label";

export const maxDuration = 60;

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [email, wallet, profile] = await Promise.all([
    configured ? requestUserEmail() : Promise.resolve(null),
    configured ? getGameWallet() : Promise.resolve({ coins: 0, earned: 0 }),
    configured ? getProfile() : Promise.resolve(null),
  ]);

  return (
    <AppShell
      email={email}
      displayName={accountLabel(profile?.display_name, email)}
      configured={configured}
      isAdmin={isMarketplaceAdmin(email)}
      coins={wallet.coins}
      earned={wallet.earned}
    >
      {children}
    </AppShell>
  );
}
