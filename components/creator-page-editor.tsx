"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, MousePointerClick, Plus, Trash2 } from "lucide-react";
import { addCreatorLink, deleteCreatorLink, reorderCreatorLinks, saveCreatorPage, updateCreatorLink } from "@/lib/actions/creator";
import { CopyButton } from "@/components/copy-button";
import { Button, Card, Field, TextArea, TextInput } from "@/components/ui";
import { MAX_CREATOR_LINKS, MAX_RATES, isValidHandle, normalizeHandle, type CreatorLink, type CreatorPageFields } from "@/lib/creator-page";

function LinksManager({ links, disabled }: { links: CreatorLink[]; disabled: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("https://");
  const [busy, setBusy] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { title: string; url: string }>>({});
  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);

  async function move(index: number, direction: -1 | 1) {
    const ids = links.map((link) => link.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setBusy(`move-${ids[target]}`);
    const result = await reorderCreatorLinks(ids);
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    router.refresh();
  }

  return (
    <Card className="grid gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Links</h2>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <MousePointerClick className="h-4 w-4" aria-hidden />
          {totalClicks.toLocaleString("en-IN")} total click{totalClicks === 1 ? "" : "s"}
        </p>
      </div>

      {links.length ? (
        <ul className="grid gap-2">
          {links.map((link, index) => {
            const edit = edits[link.id];
            const changed = edit && (edit.title !== link.title || edit.url !== link.url);
            return (
              <li key={link.id} className="grid gap-2 rounded-xl border border-line p-3">
                <TextInput
                  aria-label="Link title"
                  value={edit?.title ?? link.title}
                  maxLength={60}
                  onChange={(event) => setEdits((current) => ({ ...current, [link.id]: { title: event.target.value, url: current[link.id]?.url ?? link.url } }))}
                />
                <TextInput
                  aria-label="Link address"
                  value={edit?.url ?? link.url}
                  onChange={(event) => setEdits((current) => ({ ...current, [link.id]: { title: current[link.id]?.title ?? link.title, url: event.target.value } }))}
                />
                <div className="flex items-center gap-1">
                  <span className="mr-auto whitespace-nowrap text-xs font-medium tabular-nums text-muted">{link.clicks} click{link.clicks === 1 ? "" : "s"}</span>
                  {changed ? (
                    <Button
                      className="min-h-9 px-3"
                      loading={busy === `save-${link.id}`}
                      onClick={async () => {
                        setBusy(`save-${link.id}`);
                        const result = await updateCreatorLink(link.id, edit);
                        setBusy(null);
                        if (!result.ok) return toast.error(result.error);
                        setEdits((current) => {
                          const next = { ...current };
                          delete next[link.id];
                          return next;
                        });
                        toast.success("Link updated");
                        router.refresh();
                      }}
                    >
                      Save
                    </Button>
                  ) : null}
                  <Button variant="ghost" className="min-h-9 min-w-9 px-0" aria-label="Move up" disabled={index === 0 || busy !== null} onClick={() => move(index, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="min-h-9 min-w-9 px-0" aria-label="Move down" disabled={index === links.length - 1 || busy !== null} onClick={() => move(index, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-9 min-w-9 px-0 text-danger"
                    aria-label={`Remove ${link.title}`}
                    loading={busy === `delete-${link.id}`}
                    onClick={async () => {
                      setBusy(`delete-${link.id}`);
                      const result = await deleteCreatorLink(link.id);
                      setBusy(null);
                      if (!result.ok) return toast.error(result.error);
                      router.refresh();
                    }}
                  >
                    {busy === `delete-${link.id}` ? null : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">No links yet. Add your latest video, an affiliate product, or your shop.</p>
      )}

      <form
        className="grid gap-3 border-t border-line pt-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy("add");
          const result = await addCreatorLink({ title, url });
          setBusy(null);
          if (!result.ok) return toast.error(result.error);
          setTitle("");
          setUrl("https://");
          toast.success("Link added");
          router.refresh();
        }}
      >
        <Field label="Title">
          <TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="My latest video" maxLength={60} required />
        </Field>
        <Field label="Address">
          <TextInput value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" required inputMode="url" />
        </Field>
        <Button type="submit" className="w-full sm:w-fit" loading={busy === "add"} disabled={disabled || links.length >= MAX_CREATOR_LINKS}>
          <Plus className="h-4 w-4" aria-hidden />
          Add link
        </Button>
      </form>
    </Card>
  );
}

export function CreatorPageEditor({
  origin,
  configured,
  missing,
  handle: savedHandle,
  isPublic: savedPublic,
  page: savedPage,
  links,
}: {
  origin: string;
  configured: boolean;
  missing: boolean;
  handle: string;
  isPublic: boolean;
  page: CreatorPageFields;
  links: CreatorLink[];
}) {
  const router = useRouter();
  const [handle, setHandle] = useState(savedHandle);
  const [isPublic, setIsPublic] = useState(savedPublic);
  const [page, setPage] = useState(savedPage);
  const [saving, setSaving] = useState(false);
  const normalized = normalizeHandle(handle);
  const handleOk = !normalized || isValidHandle(normalized);
  const publicUrl = savedHandle ? `${origin}/c/${savedHandle}` : "";
  const patch = (partial: Partial<CreatorPageFields>) => setPage((current) => ({ ...current, ...partial }));

  if (missing) {
    return (
      <Card>
        <p className="text-sm leading-6 text-warn">Run the creator tools SQL (20261126120000_creator_tools.sql) in Supabase to turn on your creator page.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <div className="grid content-start gap-4">
        <Card className="grid gap-4">
          <h2 className="font-semibold">Page address</h2>
          <Field label="Page name" hint="3–30 lowercase letters, numbers, or underscores. This becomes your link.">
            <div className="flex min-w-0 items-center rounded-xl border border-line bg-surface-2 pl-3 focus-within:border-accent">
              <span className="shrink-0 truncate text-sm text-muted">{origin.replace(/^https?:\/\//, "")}/c/</span>
              <input
                value={handle}
                onChange={(event) => setHandle(event.target.value.toLowerCase())}
                maxLength={30}
                className="h-10 min-w-0 flex-1 rounded-r-xl border-0 bg-surface px-2 text-base shadow-none focus:shadow-none sm:text-sm"
                aria-invalid={!handleOk}
                placeholder="yourname"
              />
            </div>
          </Field>
          {!handleOk ? <p className="-mt-2 text-sm text-danger">Use only a–z, 0–9, and underscores (3 to 30 characters).</p> : null}
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
            <span>
              <span className="font-medium">Make the page public</span>
              <span className="block text-[13px] text-muted">Anyone with the link can see your name, the details below, and your links. Turn it off any time.</span>
            </span>
          </label>
          {publicUrl && savedPublic ? (
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-surface-2 p-2 pl-3">
              <code className="min-w-0 flex-1 truncate text-xs">{publicUrl}</code>
              <CopyButton text={publicUrl} label="Copy page link" compact />
              <a href={publicUrl} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface hover:text-ink" aria-label="Open public page">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ) : null}
        </Card>

        <Card className="grid gap-4">
          <h2 className="font-semibold">Media kit</h2>
          <Field label="Short bio" hint="One or two sentences brands will read first.">
            <TextArea value={page.headline} onChange={(event) => patch({ headline: event.target.value })} maxLength={280} className="min-h-20" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Niche">
              <TextInput value={page.niche} onChange={(event) => patch({ niche: event.target.value })} placeholder="Food, travel…" maxLength={80} />
            </Field>
            <Field label="Location">
              <TextInput value={page.location} onChange={(event) => patch({ location: event.target.value })} placeholder="Kochi, Kerala" maxLength={80} />
            </Field>
            <Field label="Languages">
              <TextInput value={page.languages} onChange={(event) => patch({ languages: event.target.value })} placeholder="Malayalam, English" maxLength={80} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="YouTube subscribers">
              <TextInput value={page.youtube_subscribers} onChange={(event) => patch({ youtube_subscribers: event.target.value })} placeholder="25K" maxLength={20} />
            </Field>
            <Field label="Instagram followers">
              <TextInput value={page.instagram_followers} onChange={(event) => patch({ instagram_followers: event.target.value })} placeholder="40K" maxLength={20} />
            </Field>
            <Field label="Average views">
              <TextInput value={page.average_views} onChange={(event) => patch({ average_views: event.target.value })} placeholder="12K" maxLength={20} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="YouTube channel link">
              <TextInput value={page.youtube_url} onChange={(event) => patch({ youtube_url: event.target.value })} placeholder="https://youtube.com/@…" />
            </Field>
            <Field label="Instagram profile link">
              <TextInput value={page.instagram_url} onChange={(event) => patch({ instagram_url: event.target.value })} placeholder="https://instagram.com/…" />
            </Field>
          </div>
          <Field label="Contact email for brands" hint="Shown on your public page. Use a work address if you have one.">
            <TextInput type="email" value={page.contact_email} onChange={(event) => patch({ contact_email: event.target.value })} maxLength={120} />
          </Field>

          <div className="grid gap-2">
            <span className="text-sm font-medium">Rates</span>
            {page.rates.map((rate, index) => (
              <div key={index} className="grid grid-cols-[1fr_9rem_auto] gap-2">
                <TextInput
                  aria-label="What you offer"
                  value={rate.label}
                  placeholder="1 Instagram reel"
                  maxLength={60}
                  onChange={(event) => patch({ rates: page.rates.map((item, at) => (at === index ? { ...item, label: event.target.value } : item)) })}
                />
                <TextInput
                  aria-label="Price"
                  value={rate.price}
                  placeholder="₹8,000"
                  maxLength={40}
                  onChange={(event) => patch({ rates: page.rates.map((item, at) => (at === index ? { ...item, price: event.target.value } : item)) })}
                />
                <Button variant="ghost" className="min-w-10 px-0 text-danger" aria-label="Remove rate" onClick={() => patch({ rates: page.rates.filter((_, at) => at !== index) })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="secondary"
              className="w-fit"
              disabled={page.rates.length >= MAX_RATES}
              onClick={() => patch({ rates: [...page.rates, { label: "", price: "" }] })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add a rate
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button
              loading={saving}
              disabled={!configured || !handleOk}
              onClick={async () => {
                setSaving(true);
                const result = await saveCreatorPage({ handle: normalized, isPublic, page: { ...page, rates: page.rates.filter((rate) => rate.label.trim()) } });
                setSaving(false);
                if (!result.ok) return toast.error(result.error);
                toast.success(result.message ?? "Saved");
                router.refresh();
              }}
            >
              Save page
            </Button>
            <span className="text-xs text-muted">Links below save on their own.</span>
          </div>
        </Card>
      </div>

      <div className="grid content-start gap-4">
        <LinksManager links={links} disabled={!configured} />
      </div>
    </div>
  );
}
