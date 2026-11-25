import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { buildCalendar, type FeedItem } from "@/lib/ical";
import { tooManyAttempts } from "@/lib/security/attempts";
import { clientAddress, requestOrigin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSecretToken } from "@/lib/tokens";

// Calendar apps poll this link without signing in; the long random token is the only key.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  const token = raw.replace(/\.ics$/i, "");
  if (!isSupabaseConfigured() || !isSecretToken(token)) return new NextResponse("Not found", { status: 404 });

  const address = await clientAddress();
  if (tooManyAttempts(`calendar:${address}`, 120, 60 * 60 * 1000)) {
    return new NextResponse("Too many requests", { status: 429, headers: { "Retry-After": "600" } });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("calendar_feed", { p_token: token });
  if (error) return new NextResponse("Calendar is not available", { status: 503 });
  const items = (Array.isArray(data) ? data : []) as FeedItem[];
  if (!items.length) {
    // An unknown token and an empty calendar look the same, so a guessed token reveals nothing.
    return new NextResponse(buildCalendar([], { name: "Content Studio" }), {
      headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=300" },
    });
  }
  const body = buildCalendar(items, { name: "Content Studio", appUrl: await requestOrigin() });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="content-studio.ics"',
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
