import type { Metadata } from "next";
import { FestivalPlanner } from "@/components/festival-planner";
import { PageHeader } from "@/components/ui";
import { channelIsSetUp, channelSummary } from "@/lib/channel-profile";
import { isSupabaseConfigured, remoteAiEnabled } from "@/lib/env";
import { getChannelProfile } from "@/lib/queries";

export const metadata: Metadata = { title: "Festival ideas" };

function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default async function FestivalsPage() {
  const { channel } = await getChannelProfile();
  const setUp = channelIsSetUp(channel);
  return (
    <div>
      <PageHeader
        eyebrow="Plan"
        title="Festival ideas"
        description="Pick an upcoming festival, then let AI write video ideas that fit your channel."
      />
      <FestivalPlanner
        today={todayInIndia()}
        configured={isSupabaseConfigured()}
        aiConnected={remoteAiEnabled()}
        channelSummary={setUp && channel ? channelSummary(channel) : null}
        channelLanguage={channel?.language ?? "en"}
        channelPlatform={channel?.platform ?? "both"}
      />
    </div>
  );
}
