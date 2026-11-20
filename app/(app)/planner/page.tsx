import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { PlannerStudio } from "@/components/planner-studio";
import { isSupabaseConfigured, remoteAiEnabled } from "@/lib/env";
import { listCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Content planner" };

export default async function PlannerPage() {
  const categories = await listCategories();

  return (
    <div>
      <PageHeader
        eyebrow="Plan"
        title="Idea planner"
        description="Build 1 to 7 days of video ideas. Each idea is a title, how to shoot it, and a spoken audio script for 15 seconds up to 5 minutes."
      />
      <PlannerStudio
        configured={isSupabaseConfigured()}
        aiConnected={remoteAiEnabled()}
        categories={categories}
      />
    </div>
  );
}
