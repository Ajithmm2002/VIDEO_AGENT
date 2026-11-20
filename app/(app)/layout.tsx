import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const user = await getCurrentUser();
  if (configured && !user) redirect("/login");

  return (
    <AppShell email={user?.email ?? null} configured={configured}>
      {children}
    </AppShell>
  );
}
