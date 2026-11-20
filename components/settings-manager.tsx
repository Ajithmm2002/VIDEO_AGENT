"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { restoreBackup } from "@/lib/actions/backup";
import { deleteCategory, saveCategory, updateDisplayName } from "@/lib/actions/catalog";
import { ConfirmButton } from "@/components/confirm-button";
import { Button, Card, Field, TextInput } from "@/components/ui";
import { categoryColors } from "@/lib/labels";
import type { Category, Profile } from "@/lib/types";

export function SettingsManager({
  profile,
  categories,
  configured,
}: {
  profile: Profile | null;
  categories: Category[];
  configured: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [categoryName, setCategoryName] = useState("");
  const [color, setColor] = useState(categoryColors[0]);
  const [restoreText, setRestoreText] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  return (
    <div className="grid gap-4">
      <Card className="grid max-w-xl gap-3">
        <h2 className="font-semibold">Profile</h2>
        <Field label="Display name">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
        </Field>
        <Button
          className="w-fit"
          loading={savingName}
          disabled={!configured}
          onClick={async () => {
            setSavingName(true);
            try {
              const result = await updateDisplayName(name);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success("Name saved");
              router.refresh();
            } finally {
              setSavingName(false);
            }
          }}
        >
          {savingName ? "Saving…" : "Save name"}
        </Button>
      </Card>

      <Card className="grid gap-3">
        <h2 className="font-semibold">Categories</h2>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Name">
            <TextInput value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
          </Field>
          <div className="flex gap-2 pb-1">
            {categoryColors.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Use colour ${swatch}`}
                onClick={() => setColor(swatch)}
                className="h-8 w-8 rounded-full border-2"
                style={{ background: swatch, borderColor: color === swatch ? "var(--ink)" : "transparent" }}
              />
            ))}
          </div>
          <Button
            loading={addingCategory}
            disabled={!configured}
            onClick={async () => {
              setAddingCategory(true);
              try {
                const result = await saveCategory(null, { name: categoryName, color });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                setCategoryName("");
                toast.success("Category saved");
                router.refresh();
              } finally {
                setAddingCategory(false);
              }
            }}
          >
            {addingCategory ? "Adding…" : "Add category"}
          </Button>
        </div>
        <div className="grid gap-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2">
              <span className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: category.color ?? "#a8a29e" }} />
                {category.name}
              </span>
              <ConfirmButton
                label="Delete"
                title="Delete this category?"
                message="Content in this category stays. It will just have no category."
                confirmLabel="Delete"
                pendingLabel="Deleting…"
                onConfirm={async () => {
                  const result = await deleteCategory(category.id);
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Category deleted");
                  router.refresh();
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="grid gap-3">
        <h2 className="font-semibold">Export and backup</h2>
        <p className="text-sm text-muted">CSV and JSON include only your account. Thumbnail image files are not inside the JSON backup.</p>
        <div className="flex flex-wrap gap-2">
          {configured ? (
            <>
              <a href="/api/export/csv" className="inline-flex items-center rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold">Download CSV</a>
              <a href="/api/export/backup" className="inline-flex items-center rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold">Download backup</a>
            </>
          ) : (
            <p className="text-sm text-muted">Connect Supabase to export your account.</p>
          )}
        </div>
        <Field label="Restore a backup" hint="This adds the rows to your account. It does not delete what is already here.">
          <input
            type="file"
            accept="application/json"
            disabled={!configured}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              setRestoreText(file ? await file.text() : "");
            }}
          />
        </Field>
        <ConfirmButton
          label="Restore backup"
          title="Restore this backup?"
          message="Imported content is added to your account. Current content stays where it is."
          confirmLabel="Restore"
          pendingLabel="Restoring…"
          disabled={!configured || !restoreText}
          onConfirm={async () => {
            const result = await restoreBackup(restoreText);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(result.message ?? "Backup restored");
            router.refresh();
          }}
        />
      </Card>
    </div>
  );
}
