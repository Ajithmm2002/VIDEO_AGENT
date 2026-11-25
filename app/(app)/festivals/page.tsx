import type { Metadata } from "next";
import { FestivalPlanner } from "@/components/festival-planner";
import { PageHeader } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Festival ideas" };

function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default function FestivalsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Plan"
        title="Festival ideas"
        description="Ready-made video ideas for festivals and special days. Add the ones you like to Content with a suggested posting date a few days before."
      />
      <FestivalPlanner today={todayInIndia()} configured={isSupabaseConfigured()} />
    </div>
  );
}
