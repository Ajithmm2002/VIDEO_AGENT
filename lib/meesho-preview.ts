import { formatListingPrice } from "@/lib/listing-price";
import { assertPublicHost, parsePublicHttpsUrl } from "@/lib/safe-url";
import type { ProductPreview } from "@/lib/types";

const MEESHO_COLLECTION_API = "https://affiliate.meesho.com/api/affiliate/api/v1/collection";
const COLLECTION_ID = /^\d{1,20}$/;
const COLLECTION_TYPE = /^[A-Za-z0-9_]{1,40}$/;

export type MeeshoAffiliateRef = {
  collectionId: string;
  collectionType: string;
  productId: string | null;
};

type MeeshoProduct = {
  id?: unknown;
  name?: unknown;
  price?: unknown;
  rating?: unknown;
  rating_count?: unknown;
  images?: unknown;
};

export function isMeeshoHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return host === "meesho.com" || host.endsWith(".meesho.com");
}

export function isMeeshoAffiliateShell(hostname: string, title: string, image: string | null) {
  if (!isMeeshoHost(hostname) || image) return false;
  const normalized = title.trim().toLowerCase();
  return normalized === "" || normalized === "affiliate web" || normalized === "document";
}

function decodeBase64Text(value: string) {
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    return /^[\x20-\x7E]+$/.test(decoded) ? decoded : "";
  } catch {
    return "";
  }
}

function productIdFrom(url: URL) {
  const value = url.searchParams.get("p_id")?.trim() || "";
  return COLLECTION_ID.test(value) ? value : null;
}

function parseInvite(url: URL): MeeshoAffiliateRef | null {
  const match = url.pathname.match(/^\/af_invite\/([^/]+)\/?$/i);
  if (!match?.[1]) return null;
  const parts = decodeURIComponent(match[1]).split(":");
  if (parts.length < 3) return null;
  const collectionType = parts[1];
  const collectionId = parts[2];
  if (!COLLECTION_ID.test(collectionId) || !COLLECTION_TYPE.test(collectionType)) return null;
  return { collectionId, collectionType, productId: productIdFrom(url) };
}

function parseCollection(url: URL): MeeshoAffiliateRef | null {
  const match = url.pathname.match(/^\/collection\/([^/]+)\/?$/i);
  if (!match?.[1]) return null;
  const decoded = decodeBase64Text(decodeURIComponent(match[1]));
  const parts = decoded.split(":").filter(Boolean);
  if (parts.length < 2) return null;
  const collectionId = parts[0];
  const collectionType = parts[parts.length - 1];
  if (!COLLECTION_ID.test(collectionId) || !COLLECTION_TYPE.test(collectionType)) return null;
  return { collectionId, collectionType, productId: productIdFrom(url) };
}

export function parseMeeshoAffiliateLink(url: URL): MeeshoAffiliateRef | null {
  if (!isMeeshoHost(url.hostname)) return null;
  return parseInvite(url) ?? parseCollection(url);
}

function firstHttpsImage(images: unknown) {
  if (!Array.isArray(images)) return null;
  for (const item of images) {
    if (typeof item === "string") {
      const parsed = parsePublicHttpsUrl(item);
      if (parsed) return parsed;
      continue;
    }
    if (item && typeof item === "object" && "url" in item && typeof item.url === "string") {
      const parsed = parsePublicHttpsUrl(item.url);
      if (parsed) return parsed;
    }
  }
  return null;
}

function pickProduct(products: MeeshoProduct[], productId: string | null) {
  if (productId) {
    const match = products.find((product) => String(product.id) === productId);
    if (match) return match;
  }
  return products[0] ?? null;
}

function productSummary(product: MeeshoProduct) {
  const parts: string[] = [];
  if (typeof product.price === "number" && Number.isFinite(product.price)) {
    parts.push(`₹${Math.round(product.price)}`);
  }
  if (typeof product.rating === "number" && Number.isFinite(product.rating)) {
    const count = typeof product.rating_count === "number" ? product.rating_count : null;
    parts.push(count != null ? `Rated ${product.rating} (${count} ratings)` : `Rated ${product.rating}`);
  }
  return parts.join(" · ");
}

async function safeImageUrl(raw: URL | null) {
  if (!raw) return null;
  try {
    await assertPublicHost(raw.hostname);
    return raw.toString();
  } catch {
    return null;
  }
}

async function fetchMeeshoCollection(ref: MeeshoAffiliateRef): Promise<MeeshoProduct[]> {
  const apiUrl = parsePublicHttpsUrl(
    `${MEESHO_COLLECTION_API}/${ref.collectionId}?collectionType=${encodeURIComponent(ref.collectionType)}`,
  );
  if (!apiUrl) {
    throw new Error("That Meesho link cannot be previewed.");
  }
  await assertPublicHost(apiUrl.hostname);

  const response = await fetch(apiUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      Accept: "application/json",
      Origin: "https://affiliate.meesho.com",
      Referer: "https://affiliate.meesho.com/",
      "User-Agent": "Mozilla/5.0 (compatible; ContentStudio/1.0; +https://video-agent-gs18.vercel.app)",
      "app-client-id": "WEB",
    },
    signal: AbortSignal.timeout(8000),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("json")) {
    throw new Error("The Meesho listing could not be opened.");
  }

  const payload = (await response.json()) as { products?: unknown };
  if (!Array.isArray(payload.products) || payload.products.length === 0) {
    throw new Error("No product was found for that Meesho link.");
  }
  return payload.products as MeeshoProduct[];
}

export async function tryMeeshoProductPreview(url: URL, originalUrl: string): Promise<ProductPreview | null> {
  const ref = parseMeeshoAffiliateLink(url);
  if (!ref) return null;

  const product = pickProduct(await fetchMeeshoCollection(ref), ref.productId);
  if (!product) {
    throw new Error("No product was found for that Meesho link.");
  }

  const title = typeof product.name === "string" ? product.name.trim() : "";
  const price = typeof product.price === "number" ? formatListingPrice(product.price, "INR") : "";
  return {
    url: originalUrl,
    title: (title || "Meesho product").slice(0, 200),
    description: productSummary(product).slice(0, 500),
    image: await safeImageUrl(firstHttpsImage(product.images)),
    siteName: "Meesho",
    price: price || null,
  };
}
