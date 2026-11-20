import { containsMalayalam, hashtagsFor, toEnglishHashtags } from "@/lib/ai/local";
import type { AffiliateAd, AffiliateProductType, Language, Platform } from "@/lib/types";

const typeLooks: Record<AffiliateProductType, { subject: string; image: string; video: string; tags: string[] }> = {
  clothing: {
    subject: "fashion garment on a clean set",
    image: "editorial clothing campaign, garment on an invisible mannequin or a still model cropped at the shoulders, fabric texture sharp, colour-accurate",
    video: "slow fabric movement, a 180-degree orbit, a close-up of stitching, then a clean outfit hero shot",
    tags: ["#Fashion", "#Clothing", "#Outfit", "#StyleInspo", "#Lookbook"],
  },
  jewellery: {
    subject: "fine jewellery piece",
    image: "luxury jewellery advertisement, metal and stones catching a single specular highlight on dark stone, macro detail, catalogue grade",
    video: "a slow 360 orbit, light raking across metal, a macro of the stones, then a locked hero shot",
    tags: ["#Jewellery", "#Jewelry", "#Gold", "#Luxury", "#Accessories"],
  },
  shoes: {
    subject: "pair of shoes",
    image: "premium footwear advertisement, pair of shoes on a seamless studio floor, three-quarter hero angle, sole and upper both readable",
    video: "a low glide around the pair, a close-up of the sole and stitching, then a still product hero",
    tags: ["#Shoes", "#Sneakers", "#Footwear", "#Style", "#Streetwear"],
  },
  electronics: {
    subject: "consumer electronics product",
    image: "high-end electronics advertisement, product floating over a dark gradient, edge lighting, screen or LED optional, tech-catalogue look",
    video: "a precision orbit, a close-up of ports and finish, a brief power-on moment, then a clean pack shot",
    tags: ["#Electronics", "#Gadgets", "#TechReview", "#Unboxing", "#Gadget"],
  },
  beauty: {
    subject: "beauty or skincare product",
    image: "beauty campaign still, bottle or compact on wet glass, soft beauty lighting, condensation optional, luxury drugstore-to-prestige look",
    video: "a glossy macro of the pack, a slow pour or texture swirl if relevant, then a hero pack shot",
    tags: ["#Beauty", "#Skincare", "#Makeup", "#Glow", "#SelfCare"],
  },
  home: {
    subject: "home product in a styled interior",
    image: "lifestyle product advertisement, item in a tidy modern interior with one hero object, natural window light plus a fill",
    video: "a slow push-in on the object in the room, a detail close-up, then a catalogue still",
    tags: ["#Home", "#HomeDecor", "#Interior", "#Lifestyle", "#HomeFinds"],
  },
  other: {
    subject: "retail product",
    image: "clean e-commerce advertisement, product centred on a seamless studio background, commercial catalogue lighting",
    video: "a simple orbit, one feature close-up, then a locked product hero",
    tags: ["#Product", "#Shopping", "#MustHave", "#Deal", "#ShopThis"],
  },
};

function productLabel(name: string, type: AffiliateProductType) {
  return name.trim() || typeLooks[type].subject;
}

export function localAffiliateAd(input: {
  productType: AffiliateProductType;
  productName: string;
  productUrl: string;
  notes: string;
  language: Language;
  platform: Platform;
  hashtagCount: number;
}): AffiliateAd {
  const look = typeLooks[input.productType];
  const name = productLabel(input.productName, input.productType);
  const malayalam = input.language === "ml" || containsMalayalam(input.productName) || containsMalayalam(input.notes);
  const notes = input.notes.trim();
  const link = input.productUrl.trim();
  const count = Math.min(30, Math.max(5, input.hashtagCount));

  const imagePrompt = [
    "Professional paid advertisement still, not a social screenshot and not a YouTube thumbnail collage.",
    `Format: generate both a 16:9 landscape ad and a 9:16 vertical ad of the same ${look.subject}.`,
    `Product: "${name}". ${look.image}.`,
    notes ? `Must show this selling point: ${notes}.` : "Show the real product clearly, colour-accurate, sharp edges.",
    "Lighting: studio key plus a slim rim light, commercial catalogue quality, no muddy shadows.",
    "Background: seamless or one premium surface. No clutter, no extra products, no people unless a cropped fashion model is required for clothing.",
    "Text: no logos, no watermarks, no price tags, no UI chrome. Leave a quiet lower third for later captions.",
    "Avoid: cartoon style, distorted product, extra hands, fake brand marks, busy collage.",
  ].join(" ");

  const videoPrompt = [
    "Professional 15 to 30 second product advertisement for Instagram Reels, YouTube Shorts, and paid social.",
    `Product: "${name}". ${look.video}.`,
    notes ? `Highlight: ${notes}.` : "Show one clear benefit, then end on a pack shot.",
    "Camera: slow, stable, commercial. No handheld shake. No talking-head unless clothing needs a model walk.",
    "Lighting: studio or controlled beauty light. Colour-accurate product.",
    "Audio: no voiceover script. Leave room for a later voiceover. Optional soft whoosh only.",
    "End card: clean product hero, empty space for a shop CTA. No fake logos.",
    "Avoid: memes, comedy skits, cluttered rooms, unreadable product.",
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

  return {
    title: `${name} | ${look.subject}`.slice(0, 80),
    postDescription,
    instagramCaption,
    hashtags,
    imagePrompt,
    videoPrompt,
    provider: "local",
  };
}
