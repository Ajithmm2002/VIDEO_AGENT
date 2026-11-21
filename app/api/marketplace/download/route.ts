import { NextResponse } from "next/server";
import { isMarketplaceAdmin } from "@/lib/env";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session.ok) return new NextResponse(session.error, { status: 401 });

  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Missing skill.", { status: 400 });

  const { data: listing, error } = await session.supabase
    .from("marketplace_listings")
    .select("id, file_path, file_name")
    .eq("id", id)
    .maybeSingle();
  if (error || !listing?.file_path) return new NextResponse("That file is not ready.", { status: 404 });

  const admin = isMarketplaceAdmin(session.user.email);
  if (!admin) {
    const { data: purchase } = await session.supabase
      .from("marketplace_purchases")
      .select("status")
      .eq("listing_id", id)
      .eq("buyer_id", session.user.id)
      .maybeSingle();
    if (purchase?.status !== "paid") {
      return new NextResponse("Buy this skill to download the file.", { status: 403 });
    }
  }

  const { data, error: signedError } = await session.supabase.storage
    .from("marketplace-files")
    .createSignedUrl(listing.file_path, 60);
  if (signedError || !data?.signedUrl) return new NextResponse("Could not open the file.", { status: 500 });

  return NextResponse.redirect(data.signedUrl);
}
