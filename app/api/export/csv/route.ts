import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { toCsv } from "@/lib/utils";
import { asContent } from "@/lib/records";

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return new NextResponse(session.error, { status: 401 });
  const { data, error } = await session.supabase
    .from("contents")
    .select("*, categories(name)")
    .order("updated_at", { ascending: false });
  if (error) return new NextResponse("Could not export content.", { status: 500 });

  const rows = (data ?? []).map((row) => {
    const content = asContent(row);
    const category = row as { categories?: { name?: string } | { name?: string }[] | null };
    const categoryName = Array.isArray(category.categories)
      ? category.categories[0]?.name ?? ""
      : category.categories?.name ?? "";
    return [
      content.title,
      content.topic,
      content.platform,
      content.language,
      content.status,
      categoryName,
      content.planned_date,
      content.video_url,
      content.published_url,
      content.tags.join(" "),
      content.hashtags.join(" "),
      content.views,
      content.likes,
      content.comments,
      content.description,
      content.youtube_description,
      content.instagram_caption,
      content.notes,
      content.updated_at,
    ];
  });

  const csv = toCsv([
    [
      "title",
      "topic",
      "platform",
      "language",
      "status",
      "category",
      "planned_date",
      "video_url",
      "published_url",
      "tags",
      "hashtags",
      "views",
      "likes",
      "comments",
      "description",
      "youtube_description",
      "instagram_caption",
      "notes",
      "updated_at",
    ],
    ...rows,
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"content.csv\"",
      "Cache-Control": "private, no-store",
    },
  });
}
