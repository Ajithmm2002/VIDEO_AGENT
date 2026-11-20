"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createFromWriting } from "@/lib/actions/generate";
import { onGenerationResult, startAffiliateGeneration, useGenerationJobs } from "@/lib/background-generate";
import { CopyButton } from "@/components/copy-button";
import { Button, Card, CountSelect, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { affiliateProductTypeLabels, googleFlowUrl, languageLabels, platformLabels } from "@/lib/labels";
import type { AffiliateAd, AffiliateProductType, Language, Platform, ProductPreview } from "@/lib/types";
import { affiliateProductTypes, languages, platforms } from "@/lib/types";
import { clearDraft, readDraft, writeDraft } from "@/lib/draft";
import { priceFromPreviewText } from "@/lib/listing-price";
import { defaultChecklist, newId } from "@/lib/utils";

function DraftField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <Card className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{label}</h2>
        <CopyButton text={value} />
      </div>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      <TextArea className="min-h-32" value={value} onChange={(event) => onChange(event.target.value)} />
    </Card>
  );
}

export function AffiliateStudio({
  configured,
  aiConnected,
  accountName,
}: {
  configured: boolean;
  aiConnected: boolean;
  accountName: string;
}) {
  const router = useRouter();
  const jobs = useGenerationJobs();
  const pending = jobs.affiliate.pending;
  const [productType, setProductType] = useState<AffiliateProductType>("clothing");
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [hashtagCount, setHashtagCount] = useState(15);
  const [creditName, setCreditName] = useState(accountName);
  const [price, setPrice] = useState("");
  const [professionalImageAd, setProfessionalImageAd] = useState(false);
  const [preview, setPreview] = useState<ProductPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [imageBroken, setImageBroken] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [title, setTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [instagramCaption, setInstagramCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [provider, setProvider] = useState<"local" | "remote" | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- restore unsaved work after switching pages */
    const stored = readDraft<{
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
      preview: ProductPreview | null;
      title: string;
      postDescription: string;
      instagramCaption: string;
      hashtags: string[] | string;
      imagePrompt: string;
      videoPrompt: string;
      provider: "local" | "remote" | null;
    }>("affiliate-draft");
    if (stored) {
      if (stored.productType) setProductType(stored.productType);
      setProductName(stored.productName ?? "");
      setProductUrl(stored.productUrl ?? "");
      setNotes(stored.notes ?? "");
      if (stored.language) setLanguage(stored.language);
      if (stored.platform) setPlatform(stored.platform);
      if (stored.hashtagCount) setHashtagCount(stored.hashtagCount);
      setCreditName(stored.creditName?.trim() || accountName);
      setPrice(stored.price || stored.preview?.price || priceFromPreviewText(stored.preview?.description ?? ""));
      setProfessionalImageAd(Boolean(stored.professionalImageAd));
      setPreview(stored.preview ?? null);
      setTitle(stored.title ?? "");
      setPostDescription(stored.postDescription ?? "");
      setInstagramCaption(stored.instagramCaption ?? "");
      setHashtags(Array.isArray(stored.hashtags) ? stored.hashtags.join(" ") : stored.hashtags ?? "");
      setImagePrompt(stored.imagePrompt ?? "");
      setVideoPrompt(stored.videoPrompt ?? "");
      setProvider(stored.provider ?? null);
    }
    setDraftReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    return onGenerationResult<AffiliateAd>("affiliate", (result) => {
      setTitle(result.title);
      setPostDescription(result.postDescription);
      setInstagramCaption(result.instagramCaption);
      setHashtags(result.hashtags.join(" "));
      setImagePrompt(result.imagePrompt);
      setVideoPrompt(result.videoPrompt);
      setProvider(result.provider);
    });
  }, []);

  useEffect(() => {
    if (!draftReady || pending) return;
    writeDraft("affiliate-draft", {
      productType,
      productName,
      productUrl,
      notes,
      language,
      platform,
      hashtagCount,
      creditName,
      price,
      professionalImageAd,
      preview,
      title,
      postDescription,
      instagramCaption,
      hashtags,
      imagePrompt,
      videoPrompt,
      provider,
    });
  }, [draftReady, pending, productType, productName, productUrl, notes, language, platform, hashtagCount, creditName, price, professionalImageAd, preview, title, postDescription, instagramCaption, hashtags, imagePrompt, videoPrompt, provider]);

  async function loadPreview(url = productUrl) {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Paste a product link first.");
      return;
    }
    setLoadingPreview(true);
    setPreviewError("");
    setImageBroken(false);
    try {
      const response = await fetch("/api/product-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await response.json()) as { ok: boolean; preview?: ProductPreview; error?: string };
      if (!data.ok || !data.preview) {
        setPreview(null);
        setPreviewError(data.error ?? "Could not load that product link.");
        return;
      }
      setPreview(data.preview);
      setProductUrl(data.preview.url);
      if (!productName.trim() && data.preview.title) setProductName(data.preview.title);
      if (!notes.trim() && data.preview.description) setNotes(data.preview.description.slice(0, 400));
      const listingPrice = data.preview.price || priceFromPreviewText(data.preview.description);
      if (listingPrice) setPrice(listingPrice);
    } catch {
      setPreview(null);
      setPreviewError("Could not load that product link.");
    } finally {
      setLoadingPreview(false);
    }
  }

  function onGenerate() {
    if (!productName.trim() && !productUrl.trim()) {
      toast.error("Add a product name or paste a product link.");
      return;
    }
    startAffiliateGeneration({
      productType,
      productName: productName.trim() || preview?.title || "",
      productUrl: productUrl.trim(),
      notes,
      language,
      platform,
      hashtagCount,
      creditName: creditName.trim() || accountName,
      price: price.trim(),
      professionalImageAd,
    });
  }

  async function onSave() {
    if (!title.trim()) {
      toast.error("Generate the ad before saving.");
      return;
    }
    setSaving(true);
    try {
      const result = await createFromWriting({
        title,
        topic: `${affiliateProductTypeLabels[productType]} affiliate ad`,
        platform,
        language,
        status: "idea",
        category_id: null,
        description: postDescription,
        youtube_description: postDescription,
        instagram_caption: instagramCaption,
        tags: [],
        hashtags: hashtags.split(/[\s,]+/).filter(Boolean),
        script_notes: videoPrompt || null,
        thumbnail_prompt: imagePrompt || null,
        video_url: null,
        published_url: productUrl.trim() || null,
        planned_date: null,
        views: null,
        likes: null,
        comments: null,
        notes: notes || null,
        reference_links: productUrl.trim()
          ? [{ id: newId(), title: productName.trim() || title, url: productUrl.trim() }]
          : [],
        checklist: defaultChecklist(),
        is_template: false,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Affiliate ad saved as content");
      clearDraft("affiliate-draft");
      if (result.id) router.push(`/content/${result.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-muted">
            Separate from comedy and lifestyle ideas. Paste a product link, then generate a professional ad caption, hashtags, and image/video prompts.
          </p>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${provider === "remote" ? "bg-accent/12 text-accent" : "bg-surface-2 text-muted"}`}>
            {provider === "remote" ? "Gemini" : aiConnected ? "Gemini when available" : "Local templates"}
          </span>
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium">Product type</p>
          <div className="flex flex-wrap gap-2">
            {affiliateProductTypes.map((type) => {
              const on = productType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProductType(type)}
                  className={`rounded-full px-3 py-1.5 text-sm ${on ? "bg-accent text-accent-ink" : "border border-line bg-surface text-ink"}`}
                >
                  {affiliateProductTypeLabels[type]}
                </button>
              );
            })}
          </div>
        </div>
        <Field label="Product link" hint="Amazon, Flipkart, Meesho invite or collection links, or any https product page. We try to load the listing photo.">
          <div className="flex flex-wrap gap-2">
            <TextInput
              className="min-w-0 flex-1"
              value={productUrl}
              onChange={(event) => {
                setProductUrl(event.target.value);
                setPreviewError("");
              }}
              onBlur={() => {
                if (productUrl.trim().startsWith("https://") && productUrl.trim() !== preview?.url) {
                  void loadPreview();
                }
              }}
              placeholder="https://"
            />
            <Button variant="secondary" onClick={() => void loadPreview()} loading={loadingPreview} disabled={pending}>
              {loadingPreview ? "Loading…" : "Load product"}
            </Button>
          </div>
        </Field>
        {previewError ? <p className="text-sm text-danger">{previewError}</p> : null}
        {preview ? (
          <div className="grid gap-3 rounded-2xl border border-line bg-surface-2/50 p-3 sm:grid-cols-[8rem_1fr] sm:items-center">
            {preview.image && !imageBroken ? (
              <img
                src={preview.image}
                alt=""
                referrerPolicy="no-referrer"
                className="h-32 w-full rounded-xl object-cover sm:h-24 sm:w-32"
                onError={() => setImageBroken(true)}
              />
            ) : (
              <div className="grid h-32 place-items-center rounded-xl border border-dashed border-line text-xs text-muted sm:h-24 sm:w-32">
                No photo
              </div>
            )}
            <div>
              <p className="font-medium">{preview.title || "Product listing"}</p>
              {preview.siteName ? <p className="text-xs text-muted">{preview.siteName}</p> : null}
              {preview.description ? <p className="mt-1 line-clamp-3 text-sm text-muted">{preview.description}</p> : null}
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Product name" hint="Filled from the link when possible.">
            <TextInput value={productName} onChange={(event) => setProductName(event.target.value)} maxLength={200} />
          </Field>
          <Field label="What to highlight" hint="Optional. Example: 18k gold, wireless ANC, 50% off.">
            <TextInput value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} />
          </Field>
          <Field label="Account / company name" hint="Used in the end credit. Defaults to your signed-in account name.">
            <TextInput
              value={creditName}
              onChange={(event) => setCreditName(event.target.value)}
              maxLength={80}
              placeholder={accountName || "Your name or company"}
            />
          </Field>
          <Field label="Listing price" hint="Filled from the product link when possible. Shown in the end credit.">
            <TextInput value={price} onChange={(event) => setPrice(event.target.value)} maxLength={40} placeholder="₹" />
          </Field>
          <Field label="Language">
            <SelectInput value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
              {languages.map((item) => <option key={item} value={item}>{languageLabels[item]}</option>)}
            </SelectInput>
          </Field>
          <Field label="Platform">
            <SelectInput value={platform} onChange={(event) => setPlatform(event.target.value as Platform)}>
              {platforms.map((item) => <option key={item} value={item}>{platformLabels[item]}</option>)}
            </SelectInput>
          </Field>
        </div>
        <CountSelect label="Number of hashtags" value={hashtagCount} onChange={setHashtagCount} />
        <div className="grid gap-2">
          <p className="text-sm font-medium">Image prompt</p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={professionalImageAd}
              onChange={(event) => setProfessionalImageAd(event.target.checked)}
            />
            <span>
              Professional image ad
              <span className="mt-0.5 block text-xs leading-5 text-muted">
                Checked: a studio ad with the listing price on the image. Unchecked: a simple product photo with no price or ad layout.
              </span>
            </span>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onGenerate} loading={pending} disabled={saving}>
            {pending ? "Writing ad…" : "Generate product ad"}
          </Button>
          <a
            href={googleFlowUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold"
          >
            Open Google Flow <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </Card>

      {title || postDescription || imagePrompt ? (
        <>
          <Card className="grid gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Ad title</h2>
              <CopyButton text={title} />
            </div>
            <TextInput value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} />
          </Card>
          <DraftField label="Post description" value={postDescription} onChange={setPostDescription} hint="Caption for the post, including an affiliate disclosure and the end credit." />
          <DraftField label="Instagram caption" value={instagramCaption} onChange={setInstagramCaption} />
          <DraftField label="Hashtags" value={hashtags} onChange={setHashtags} hint="English hashtags, ready to paste." />
          <DraftField
            label="Image prompt"
            value={imagePrompt}
            onChange={setImagePrompt}
            hint={
              professionalImageAd
                ? "Paste into Google Flow. Professional ad with the listing price on the image."
                : "Paste into Google Flow. Simple product photo, no price or ad text on the image."
            }
          />
          <DraftField label="Video prompt" value={videoPrompt} onChange={setVideoPrompt} hint="Paste into Google Flow. The end credit uses your account/company name and listing price." />
          <Button className="w-fit" onClick={() => void onSave()} loading={saving} disabled={!configured || pending}>
            {saving ? "Saving…" : "Save as content"}
          </Button>
        </>
      ) : null}
    </div>
  );
}
