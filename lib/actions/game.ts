"use server";

import { revalidatePath } from "next/cache";
import { isGameId, previewGameCoins } from "@/lib/game-coins";
import { requireSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";

function refreshPlay() {
  revalidatePath("/play");
  revalidatePath("/marketplace");
  revalidatePath("/", "layout");
}

export async function claimGameCoins(input: {
  game: string;
  score: number;
  durationMs: number;
}): Promise<ActionResult & { awarded?: number; balance?: number; earned?: number }> {
  const session = await requireSession();
  if (!session.ok) return session;
  if (!isGameId(input.game)) return { ok: false, error: "Unknown game." };
  const score = Math.floor(Number(input.score));
  const durationMs = Math.floor(Number(input.durationMs));
  if (!Number.isFinite(score) || !Number.isFinite(durationMs)) {
    return { ok: false, error: "That run could not be read." };
  }
  if (previewGameCoins(score, durationMs) <= 0) {
    return { ok: false, error: "Play at least 20 seconds, then claim." };
  }
  const { data, error } = await session.supabase.rpc("claim_game_coins", {
    p_game: input.game,
    p_score: score,
    p_duration_ms: durationMs,
  });
  if (error) {
    return { ok: false, error: error.message || "Could not claim coins. Run the game coins SQL in Supabase." };
  }
  const row = data as { awarded?: number; balance?: number; earned?: number } | null;
  refreshPlay();
  return {
    ok: true,
    message: `Claimed ${row?.awarded ?? 0} coins.`,
    awarded: row?.awarded,
    balance: row?.balance,
    earned: row?.earned,
  };
}

export async function redeemListingWithCoins(listingId: string): Promise<ActionResult & { balance?: number }> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { data, error } = await session.supabase.rpc("redeem_listing_with_coins", {
    p_listing_id: listingId,
  });
  if (error) {
    return { ok: false, error: error.message || "Could not buy with coins." };
  }
  const row = data as { balance?: number; spent?: number } | null;
  refreshPlay();
  revalidatePath(`/marketplace/${listingId}`);
  return {
    ok: true,
    message: row?.spent ? `Bought with ${row.spent} coins.` : "Skill unlocked.",
    balance: row?.balance,
  };
}
