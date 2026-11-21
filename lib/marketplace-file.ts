import { formatCoins, priceInCoins } from "@/lib/game-coins";

export const SKILL_MAX_BYTES = 8 * 1024 * 1024;

const allowedExt = new Set(["md", "markdown", "zip"]);

export function parseSkillUpload(file: File | null) {
  if (!file) return { ok: false as const, error: "Attach a .md skill file or a .zip bundle." };
  if (file.size < 8) return { ok: false as const, error: "That file looks empty." };
  if (file.size > SKILL_MAX_BYTES) return { ok: false as const, error: "Keep the file under 8 MB." };

  const raw = file.name.split(/[/\\]/).pop()?.trim() ?? "";
  const safe = raw.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(0, 80);
  const lower = safe.toLowerCase();
  const extPart = lower.includes(".") ? lower.slice(lower.lastIndexOf(".") + 1) : "";
  if (!allowedExt.has(extPart)) {
    return { ok: false as const, error: "Use a .md skill file or a .zip bundle." };
  }
  const ext: "md" | "zip" = extPart === "zip" ? "zip" : "md";
  return {
    ok: true as const,
    ext,
    stored: `skill.${ext}` as const,
    original: safe || `skill.${ext}`,
  };
}

export function listingObjectPath(id: string, stored: string) {
  return `listings/${id}/${stored}`;
}

export function formatSkillPrice(paise: number) {
  if (paise <= 0) return "Free";
  const rupees = paise / 100;
  const rounded = Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `₹${rounded}`;
}

export function formatSkillPriceWithCoins(paise: number) {
  if (paise <= 0) return "Free";
  return `${formatSkillPrice(paise)} · ${formatCoins(priceInCoins(paise))}`;
}
