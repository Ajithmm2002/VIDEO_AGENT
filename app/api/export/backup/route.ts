import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return new NextResponse(session.error, { status: 401 });

  const [categories, contents, prompts, collections] = await Promise.all([
    session.supabase.from("categories").select("id, name, color"),
    session.supabase.from("contents").select("*"),
    session.supabase
      .from("thumbnail_prompts")
      .select("id, content_id, topic, language, landscape_prompt, vertical_prompt"),
    session.supabase.from("hashtag_collections").select("id, name, platform, hashtags"),
  ]);

  if (categories.error || contents.error || prompts.error || collections.error) {
    return new NextResponse("Could not create a backup.", { status: 500 });
  }

  const payload = {
    version: 1,
    exported_at: new Date().toISOString(),
    categories: categories.data ?? [],
    contents: (contents.data ?? []).map((row) => {
      const record = { ...(row as Record<string, unknown>) };
      delete record.user_id;
      delete record.thumbnail_path;
      delete record.created_at;
      delete record.updated_at;
      return record;
    }),
    thumbnail_prompts: prompts.data ?? [],
    hashtag_collections: (collections.data ?? []).map((row) => {
      const record = { ...(row as Record<string, unknown>) };
      delete record.user_id;
      delete record.created_at;
      delete record.updated_at;
      return record;
    }),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"content-studio-backup.json\"",
      "Cache-Control": "private, no-store",
    },
  });
}
