import { containsMalayalam, hashtagsFor, toEnglishHashtags } from "@/lib/ai/local";
import { normalizeListingPrice } from "@/lib/listing-price";
import type { AffiliateAd, AffiliateProductType, Language, Platform } from "@/lib/types";

export type AffiliateAdInput = {
  productType: AffiliateProductType;
  productName: string;
  productUrl: string;
  notes: string;
  language: Language;
  platform: Platform;
  hashtagCount: number;
  creditName?: string;
  price?: string;
  professionalImageAd?: boolean;
};

const CREDIT_LINE = /^(?:credit|credits|credited to|ക്രെഡിറ്റ്)\s*[:\-–]/i;
const PRICE_LINE = /^(?:price|mrp|cost|deal price|വില)\s*[:\-–]/i;
const PRICE_ONLY = /^(?:rs\.?|inr)?\s*₹\s*[\d,.]+(?:\s*(?:inr|rs\.?))?$/i;
const SOLD_BY = /^(?:sold by|shop|brand|store|available at)\s*[:\-–]/i;

export function affiliateCreditName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function affiliateCreditPrice(value: string) {
  return normalizeListingPrice(value);
}

export function affiliateCreditBlock(creditName: string, price: string, language: Language) {
  const name = affiliateCreditName(creditName);
  const amount = affiliateCreditPrice(price);
  const lines: string[] = [];
  if (name) lines.push(language === "ml" ? `ക്രെഡിറ്റ്: ${name}` : `Credit: ${name}`);
  if (amount) lines.push(language === "ml" ? `വില: ${amount}` : `Price: ${amount}`);
  return lines.join("\n");
}

export function stripTrailingCredit(text: string) {
  const lines = text.replace(/\s+$/u, "").split("\n");
  while (lines.length) {
    const last = (lines[lines.length - 1] ?? "").trim();
    if (!last) {
      lines.pop();
      continue;
    }
    if (CREDIT_LINE.test(last) || PRICE_LINE.test(last) || PRICE_ONLY.test(last) || SOLD_BY.test(last)) {
      lines.pop();
      continue;
    }
    break;
  }
  return lines.join("\n").trim();
}

export function withCaptionCredit(text: string, creditName: string, price: string, language: Language) {
  const block = affiliateCreditBlock(creditName, price, language);
  const stripped = stripTrailingCredit(text);
  if (!block) return stripped;
  if (stripped.endsWith(block)) return stripped;
  return stripped ? `${stripped}\n\n${block}` : block;
}

export function promptEndCredit(creditName: string, price: string) {
  const name = affiliateCreditName(creditName);
  const amount = affiliateCreditPrice(price);
  const exact = [
    name ? `"Credit: ${name}"` : null,
    amount ? `"Price: ${amount}"` : null,
  ].filter((item): item is string => Boolean(item));
  if (exact.length) {
    return `End credit on screen, exact text only: ${exact.join(" and ")}. Do not invent another person, shop, brand, handle, logo, or price.`;
  }
  return "Do not add an end credit with a name, shop, brand, or price.";
}

export function promptProfessionalImageAd(creditName: string, price: string) {
  const name = affiliateCreditName(creditName);
  const amount = affiliateCreditPrice(price);
  const parts = [
    "Professional paid retail advertisement layout, not a plain pack shot and not a social screenshot.",
    amount
      ? `Show the listing price on the ad as exact text "${amount}" in a clean professional type treatment.`
      : "Do not invent a price. Omit price text if none was provided.",
    name
      ? `Small end credit, exact text only: "Credit: ${name}".`
      : "Do not invent a shop, brand, or creator name.",
    "Do not invent another person, shop, brand, handle, logo, or price.",
  ];
  return parts.join(" ");
}

export function promptSimpleProductImage() {
  return "Simple product photograph only: centred product, plain background, no advertisement layout, no on-image text, no price, no credit, no logo, no sale badge.";
}

export function withPromptCredit(text: string, creditName: string, price: string) {
  const instruction = promptEndCredit(creditName, price);
  const stripped = text.replace(/(?:^|\n)(?:End credit|End card)\b.*$/gim, "").trim();
  if (stripped.includes(instruction)) return stripped;
  return stripped ? `${stripped}\n${instruction}` : instruction;
}

export function withProfessionalImagePrompt(text: string, creditName: string, price: string) {
  const instruction = promptProfessionalImageAd(creditName, price);
  const stripped = text.replace(/(?:^|\n)(?:End credit|End card)\b.*$/gim, "").trim();
  if (stripped.includes(instruction)) return stripped;
  return stripped ? `${stripped}\n${instruction}` : instruction;
}

export function withSimpleImagePrompt(text: string) {
  const instruction = promptSimpleProductImage();
  const stripped = text.replace(/(?:^|\n)(?:End credit|End card)\b.*$/gim, "").trim();
  if (stripped.includes(instruction)) return stripped;
  return stripped ? `${stripped}\n${instruction}` : instruction;
}

export function applyAffiliateCredits(
  ad: AffiliateAd,
  creditName: string,
  price: string,
  language: Language,
  professionalImageAd = false,
): AffiliateAd {
  return {
    ...ad,
    postDescription: withCaptionCredit(ad.postDescription, creditName, price, language).slice(0, 8000),
    instagramCaption: withCaptionCredit(ad.instagramCaption, creditName, price, language).slice(0, 5000),
    imagePrompt: (professionalImageAd
      ? withProfessionalImagePrompt(ad.imagePrompt, creditName, price)
      : withSimpleImagePrompt(ad.imagePrompt)
    ).slice(0, 8000),
    videoPrompt: withPromptCredit(ad.videoPrompt, creditName, price).slice(0, 8000),
  };
}

const typeLooks: Record<AffiliateProductType, { subject: string; image: string; simple: string; video: string; tags: string[] }> = {
  clothing: {
    subject: "fashion garment on a clean set",
    image: "editorial clothing campaign, garment on an invisible mannequin or a still model cropped at the shoulders, fabric texture sharp, colour-accurate",
    simple: "garment centred on a seamless background, full piece readable, colour-accurate fabric",
    video: "slow fabric movement, a 180-degree orbit, a close-up of stitching, then a clean outfit hero shot",
    tags: ["#Fashion", "#Clothing", "#Outfit", "#StyleInspo", "#Lookbook"],
  },
  jewellery: {
    subject: "fine jewellery piece",
    image: "luxury jewellery advertisement, metal and stones catching a single specular highlight on dark stone, macro detail, catalogue grade",
    simple: "jewellery piece centred on a plain surface, metal and stones sharp, no extra props",
    video: "a slow 360 orbit, light raking across metal, a macro of the stones, then a locked hero shot",
    tags: ["#Jewellery", "#Jewelry", "#Gold", "#Luxury", "#Accessories"],
  },
  shoes: {
    subject: "pair of shoes",
    image: "premium footwear advertisement, pair of shoes on a seamless studio floor, three-quarter hero angle, sole and upper both readable",
    simple: "pair of shoes centred on a seamless floor, three-quarter view, sole and upper readable",
    video: "a low glide around the pair, a close-up of the sole and stitching, then a still product hero",
    tags: ["#Shoes", "#Sneakers", "#Footwear", "#Style", "#Streetwear"],
  },
  electronics: {
    subject: "consumer electronics product",
    image: "high-end electronics advertisement, product floating over a dark gradient, edge lighting, screen or LED optional, tech-catalogue look",
    simple: "electronics device centred on a plain background, edges sharp, colour-accurate finish",
    video: "a precision orbit, a close-up of ports and finish, a brief power-on moment, then a clean pack shot",
    tags: ["#Electronics", "#Gadgets", "#TechReview", "#Unboxing", "#Gadget"],
  },
  beauty: {
    subject: "beauty or skincare product",
    image: "beauty campaign still, bottle or compact on wet glass, soft beauty lighting, condensation optional, luxury drugstore-to-prestige look",
    simple: "bottle or compact centred on a plain surface, label readable, no extra props",
    video: "a glossy macro of the pack, a slow pour or texture swirl if relevant, then a hero pack shot",
    tags: ["#Beauty", "#Skincare", "#Makeup", "#Glow", "#SelfCare"],
  },
  home: {
    subject: "home product in a styled interior",
    image: "lifestyle product advertisement, item in a tidy modern interior with one hero object, natural window light plus a fill",
    simple: "home product centred on a seamless background, whole object readable",
    video: "a slow push-in on the object in the room, a detail close-up, then a catalogue still",
    tags: ["#Home", "#HomeDecor", "#Interior", "#Lifestyle", "#HomeFinds"],
  },
  other: {
    subject: "retail product",
    image: "clean e-commerce advertisement, product centred on a seamless studio background, commercial catalogue lighting",
    simple: "product centred on a seamless studio background, whole object sharp and colour-accurate",
    video: "a simple orbit, one feature close-up, then a locked product hero",
    tags: ["#Product", "#Shopping", "#MustHave", "#Deal", "#ShopThis"],
  },
};

function productLabel(name: string, type: AffiliateProductType) {
  return name.trim() || typeLooks[type].subject;
}

export function localAffiliateAd(input: AffiliateAdInput): AffiliateAd {
  const look = typeLooks[input.productType];
  const name = productLabel(input.productName, input.productType);
  const malayalam = input.language === "ml" || containsMalayalam(input.productName) || containsMalayalam(input.notes);
  const notes = input.notes.trim();
  const link = input.productUrl.trim();
  const count = Math.min(30, Math.max(5, input.hashtagCount));
  const creditName = affiliateCreditName(input.creditName ?? "");
  const price = affiliateCreditPrice(input.price ?? "");
  const credit = promptEndCredit(creditName, price);
  const professionalImageAd = Boolean(input.professionalImageAd);

  const imagePrompt = professionalImageAd
    ? [
        "Professional paid advertisement still, not a social screenshot and not a YouTube thumbnail collage.",
        `Format: generate both a 16:9 landscape ad and a 9:16 vertical ad of the same ${look.subject}.`,
        `Product: "${name}". ${look.image}.`,
        notes ? `Must show this selling point: ${notes}.` : "Show the real product clearly, colour-accurate, sharp edges.",
        "Lighting: studio key plus a slim rim light, commercial catalogue quality, no muddy shadows.",
        "Background: seamless or one premium surface. No clutter, no extra products, no people unless a cropped fashion model is required for clothing.",
        promptProfessionalImageAd(creditName, price),
        "Avoid: cartoon style, distorted product, extra hands, fake brand marks, busy collage.",
      ].join(" ")
    : [
        "Simple product photograph, not an advertisement, not a poster, and not a social graphic.",
        `Format: generate both a 16:9 landscape photo and a 9:16 vertical photo of the same product.`,
        `Product: "${name}". ${look.simple}.`,
        notes ? `Show this product detail: ${notes}.` : "Show the real product clearly, colour-accurate, sharp edges.",
        "Lighting: even catalogue light. No dramatic advertising lighting.",
        "Background: plain seamless white or light grey. No lifestyle set, no extra products.",
        promptSimpleProductImage(),
        "Avoid: cartoon style, distorted product, ad banners, sale stickers, fake brand marks.",
      ].join(" ");

  const videoPrompt = [
    "Professional 15 to 30 second product advertisement for Instagram Reels, YouTube Shorts, and paid social.",
    `Product: "${name}". ${look.video}.`,
    notes ? `Highlight: ${notes}.` : "Show one clear benefit, then end on a pack shot.",
    "Camera: slow, stable, commercial. No handheld shake. No talking-head unless clothing needs a model walk.",
    "Lighting: studio or controlled beauty light. Colour-accurate product.",
    "Audio: no voiceover script. Leave room for a later voiceover. Optional soft whoosh only.",
    credit,
    "Avoid: memes, comedy skits, cluttered rooms, unreadable product, fake shop names, invented prices.",
  ].join(" ");

  const postDescription = malayalam
    ? [
        `✨ ${name}`,
        notes ? notes : "ക്യാമറയിൽ ഇതുപോലെ തന്നെ കാണും.",
        "പ്രൊഫഷണൽ ആഡ് ലുക്ക്. വിശദാംശം വ്യക്തം.",
        link ? `ഷോപ്പ് ചെയ്യൂ (അഫിലിയേറ്റ് ലിങ്ക്): ${link}` : "ലിങ്ക് ബയോയിൽ.",
        "ഈ പോസ്റ്റിൽ അഫിലിയേറ്റ് ലിങ്കുകൾ ഉണ്ട്.",
      ].join("\n")
    : [
        `✨ ${name}`,
        notes ? notes : "Looks this clean on camera, not just in the listing photos.",
        `A studio-style ${input.productType} ad made to sell the product, not a skit.`,
        link ? `Shop here (affiliate): ${link}` : "Shop link in bio.",
        "This post contains affiliate links.",
      ].join("\n");

  const instagramCaption = malayalam
    ? `${postDescription}\n\nസേവ് ചെയ്ത് ഷോപ്പ് ചെയ്യൂ.`
    : `${postDescription}\n\nSave this if you are buying.`;

  const hashtags = toEnglishHashtags(
    [
      ...look.tags,
      "#Affiliate",
      "#AffiliateMarketing",
      "#Sponsored",
      "#Ad",
      "#ShopNow",
      "#ProductAd",
      input.platform !== "youtube" ? "#Reels" : "",
      input.platform !== "instagram" ? "#YouTubeShorts" : "",
      ...hashtagsFor(name, input.platform, input.language, 8),
    ],
    count,
  );

  return applyAffiliateCredits(
    {
      title: name.slice(0, 80),
      postDescription,
      instagramCaption,
      hashtags,
      imagePrompt,
      videoPrompt,
      provider: "local",
    },
    creditName,
    price,
    input.language,
    professionalImageAd,
  );
}
