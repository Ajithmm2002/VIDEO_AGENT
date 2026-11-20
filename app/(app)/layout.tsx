import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { requestUserEmail } from "@/lib/session";

export const maxDuration = 60;

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const email = configured ? await requestUserEmail() : null;

  return (
    <AppShell email={email} configured={configured}>
      {children}
    </AppShell>
  );
}
