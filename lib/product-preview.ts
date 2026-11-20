import { formatListingPrice, normalizeListingPrice } from "@/lib/listing-price";
import { isMeeshoAffiliateShell, isMeeshoHost, tryMeeshoProductPreview } from "@/lib/meesho-preview";
import { assertPublicHost, parsePublicHttpsUrl } from "@/lib/safe-url";
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

function listingPriceFromHtml(html: string) {
  const amount = metaContent(html, ["product:price:amount", "og:price:amount"]);
  const currency = metaContent(html, ["product:price:currency", "og:price:currency"]);
  if (amount) {
    const formatted = /^[₹$€£]/.test(amount.trim()) ? normalizeListingPrice(amount) : formatListingPrice(amount, currency);
    if (formatted) return formatted;
  }
  const offer = html.match(/"offers"\s*:\s*\{[^}]{0,400}/i);
  if (offer?.[0]) {
    const price = offer[0].match(/"price"\s*:\s*"?([\d.]+)"?/i);
    const offerCurrency = offer[0].match(/"priceCurrency"\s*:\s*"([A-Z]{3})"/i);
    if (price?.[1]) {
      const formatted = formatListingPrice(price[1], offerCurrency?.[1] ?? currency);
      if (formatted) return formatted;
    }
  }
  return "";
}

export async function fetchProductPreview(rawUrl: string): Promise<ProductPreview> {
  const start = parsePublicHttpsUrl(rawUrl);
  if (!start) {
    throw new Error("Paste an https product link.");
  }
  await assertPublicHost(start.hostname);

  const meesho = await tryMeeshoProductPreview(start, rawUrl.trim());
  if (meesho) return meesho;

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
    if (isMeeshoHost(start.hostname)) {
      throw new Error("Meesho blocked that page. Paste an invite, collection, or product share link.");
    }
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

  if (isMeeshoAffiliateShell(finalUrl.hostname, title, image)) {
    throw new Error("That Meesho page is the affiliate site, not a product listing. Paste an invite or collection link.");
  }

  return {
    url: finalUrl.toString(),
    title: title.slice(0, 200),
    description: description.slice(0, 500),
    image,
    siteName: metaContent(html, ["og:site_name"]).slice(0, 80),
    price: listingPriceFromHtml(html) || null,
  };
}
