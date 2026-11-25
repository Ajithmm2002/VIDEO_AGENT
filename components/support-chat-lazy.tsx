"use client";

import dynamic from "next/dynamic";

// The support chat is not needed for first paint, so its code loads after the page is interactive.
export const SupportChatLazy = dynamic(() => import("@/components/support-chat").then((mod) => mod.SupportChat), {
  ssr: false,
});
