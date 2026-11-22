import { NextResponse } from "next/server";
import { answerSupport } from "@/lib/ai/support";
import { clientAddress } from "@/lib/session";
import { tooManyAttempts } from "@/lib/security/attempts";

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

  const address = await clientAddress();
  if (tooManyAttempts(`support:ip:${address}`, 20, 30 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Too many support messages. Try again in a little while." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const payload = body as { message?: unknown; history?: unknown };
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!message || message.length > 500) {
    return NextResponse.json({ ok: false, error: "Write a short question (500 characters or less)." }, { status: 400 });
  }

  const history = Array.isArray(payload.history)
    ? payload.history
        .filter((item): item is { role: "user" | "assistant"; content: string } => {
          if (!item || typeof item !== "object") return false;
          const row = item as { role?: unknown; content?: unknown };
          return (row.role === "user" || row.role === "assistant") && typeof row.content === "string";
        })
        .slice(-8)
        .map((item) => ({ role: item.role, content: item.content.slice(0, 500) }))
    : [];

  const reply = await answerSupport(message, history);
  return NextResponse.json({ ok: true, reply });
}
