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
        description="Pick a language, categories, and a short brief. Get a week or a month of ideas, edit them, then save them onto the calendar."
      />
      <PlannerStudio
        configured={isSupabaseConfigured()}
        aiConnected={remoteAiEnabled()}
        categories={categories}
      />
    </div>
  );
}
