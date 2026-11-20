"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteHashtagCollection, saveHashtagCollection } from "@/lib/actions/catalog";
import { ConfirmButton } from "@/components/confirm-button";
import { CopyButton } from "@/components/copy-button";
import { Button, Card, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { platformLabels } from "@/lib/labels";
import type { HashtagCollection, Platform } from "@/lib/types";
import { platforms } from "@/lib/types";

export function HashtagManager({ collections, configured }: { collections: HashtagCollection[]; configured: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [hashtags, setHashtags] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      const result = await saveHashtagCollection(editing, {
        name,
        platform: platform || null,
        hashtags: hashtags.split(/[\n,]/).map((item) => item.trim()).filter(Boolean),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Collection saved");
      setName("");
      setPlatform("");
      setHashtags("");
      setEditing(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
      <Card className="grid h-fit gap-3">
        <h2 className="font-semibold">{editing ? "Edit collection" : "New collection"}</h2>
        <Field label="Name">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Platform">
          <SelectInput value={platform} onChange={(event) => setPlatform(event.target.value as Platform | "")}>
            <option value="">Any</option>
            {platforms.map((item) => <option key={item} value={item}>{platformLabels[item]}</option>)}
          </SelectInput>
        </Field>
        <Field label="Hashtags" hint="One per line, or separated by commas.">
          <TextArea value={hashtags} onChange={(event) => setHashtags(event.target.value)} />
        </Field>
        <Button onClick={onSave} loading={saving} disabled={!configured}>
          {saving ? "Saving…" : "Save collection"}
        </Button>
      </Card>
      <div className="grid gap-3">
        {collections.length ? collections.map((collection) => (
          <Card key={collection.id} className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">{collection.name}</h3>
                <p className="text-xs text-muted">{collection.platform ? platformLabels[collection.platform] : "Any platform"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={collection.hashtags.join(" ")} label="Copy all" />
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(collection.id);
                    setName(collection.name);
                    setPlatform(collection.platform ?? "");
                    setHashtags(collection.hashtags.join("\n"));
                  }}
                >
                  Edit
                </Button>
                <ConfirmButton
                  label="Delete"
                  title="Delete this collection?"
                  message="Content that already uses these hashtags will keep its own copy."
                  confirmLabel="Delete"
                  pendingLabel="Deleting…"
                  onConfirm={async () => {
                    const result = await deleteHashtagCollection(collection.id);
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    toast.success("Collection deleted");
                    router.refresh();
                  }}
                />
              </div>
            </div>
            <p className="text-sm">{collection.hashtags.join(" ")}</p>
          </Card>
        )) : <Card><p className="text-sm text-muted">No collections yet. Save a set you reuse on YouTube or Instagram.</p></Card>}
      </div>
    </div>
  );
}
