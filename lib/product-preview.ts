import { lookup } from "node:dns/promises";
import { isPrivateIp, parsePublicHttpsUrl } from "@/lib/safe-url";
import type { ProductPreview } from "@/lib/types";

const MAX_HTML_BYTES = 700_000;

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function metaContent(html: string, names: string[]) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["']`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeEntities(match[1]);
    }
  }
  return "";
}

function titleTag(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeEntities(match[1]) : "";
}

async function assertPublicHost(hostname: string) {
  const records = await lookup(hostname, { all: true });
  if (!records.length || records.some((record) => isPrivateIp(record.address))) {
    throw new Error("That link cannot be previewed.");
  }
}

export async function fetchProductPreview(rawUrl: string): Promise<ProductPreview> {
  const start = parsePublicHttpsUrl(rawUrl);
  if (!start) {
    throw new Error("Paste an https product link.");
  }
  await assertPublicHost(start.hostname);

  const response = await fetch(start.toString(), {
    method: "GET",
    redirect: "follow",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; ContentStudio/1.0; +https://video-agent-gs18.vercel.app)",
    },
    signal: AbortSignal.timeout(8000),
  });

  const finalUrl = parsePublicHttpsUrl(response.url || start.toString());
  if (!finalUrl) {
    throw new Error("That link redirected somewhere that cannot be previewed.");
  }
  if (finalUrl.hostname !== start.hostname) {
    await assertPublicHost(finalUrl.hostname);
  }
  if (!response.ok) {
    throw new Error("The product page could not be opened.");
  }

  const buffer = await response.arrayBuffer();
  const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer.slice(0, MAX_HTML_BYTES));
  const title = metaContent(html, ["og:title", "twitter:title"]) || titleTag(html);
  const description = metaContent(html, ["og:description", "twitter:description", "description"]);
  const imageRaw = metaContent(html, ["og:image:secure_url", "og:image", "twitter:image"]);
  let image: string | null = null;
  if (imageRaw) {
    try {
      const imageUrl = parsePublicHttpsUrl(new URL(imageRaw, finalUrl).toString());
      if (imageUrl) {
        await assertPublicHost(imageUrl.hostname);
        image = imageUrl.toString();
      }
    } catch {
      image = null;
    }
  }

  return {
    url: finalUrl.toString(),
    title: title.slice(0, 200),
    description: description.slice(0, 500),
    image,
    siteName: metaContent(html, ["og:site_name"]).slice(0, 80),
  };
}
