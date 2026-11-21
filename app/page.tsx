import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Plan before you record",
  description: "A private studio for YouTube and Instagram ideas, thumbnail prompts, and publishing dates.",
};

export default async function Home() {
  const configured = isSupabaseConfigured();
  if (configured) {
    const user = await getCurrentUser();
    if (user) redirect("/dashboard");
  }

  return <LandingPage configured={configured} />;
}
