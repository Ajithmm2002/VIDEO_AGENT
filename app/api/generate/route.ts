import { NextResponse } from "next/server";
import { generateFromTopic, generatePlan, generateScript, generateThumbnails, generateWriting } from "@/lib/actions/generate";

export const maxDuration = 60;

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

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid request.");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  const input = { ...body };
  delete input.kind;

  if (kind === "thumbnail") {
    return NextResponse.json(await generateThumbnails(input as Parameters<typeof generateThumbnails>[0]));
  }
  if (kind === "writing") {
    return NextResponse.json(await generateWriting(input as Parameters<typeof generateWriting>[0]));
  }
  if (kind === "topic") {
    return NextResponse.json(await generateFromTopic(input as Parameters<typeof generateFromTopic>[0]));
  }
  if (kind === "plan") {
    return NextResponse.json(await generatePlan(input as Parameters<typeof generatePlan>[0]));
  }
  if (kind === "script") {
    return NextResponse.json(await generateScript(input as Parameters<typeof generateScript>[0]));
  }

  return NextResponse.json({ ok: false, error: "Unknown generator." }, { status: 400 });
}
