import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { tooManyAttempts } from "@/lib/security/attempts";
import { clientAddress } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Counts a click on a creator-page link, then sends the visitor on. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured() || !UUID.test(id)) return new NextResponse("Link not found", { status: 404 });

  const supabase = await createClient();
  const address = await clientAddress();
  // Count at most a few clicks per visitor per link per hour, so refreshes do not inflate numbers.
  const counted = !tooManyAttempts(`link:${id}:${address}`, 3, 60 * 60 * 1000);
  const { data, error } = counted
    ? await supabase.rpc("follow_creator_link", { p_link_id: id })
    : await supabase.rpc("creator_link_url", { p_link_id: id });
  const url = typeof data === "string" ? data : null;
  if (error || !url || !/^https:\/\/[^\s]+$/.test(url)) return new NextResponse("Link not found", { status: 404 });

  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
