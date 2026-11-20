import { NextResponse } from "next/server";
import { fetchProductPreview } from "@/lib/product-preview";
import { firstIssue, productPreviewSchema } from "@/lib/validation";

export const maxDuration = 15;

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Invalid origin." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = productPreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstIssue(parsed.error) }, { status: 400 });
  }

  try {
    const preview = await fetchProductPreview(parsed.data.url);
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Could not load that product link.",
    });
  }
}
