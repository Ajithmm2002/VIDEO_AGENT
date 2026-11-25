"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { Button, Card, Field, TextInput } from "@/components/ui";
import { updateDisplayName } from "@/lib/actions/catalog";
import { accountInitials } from "@/lib/account-label";
import { formatCoinBalance, formatCoins } from "@/lib/game-coins";
import type { GameWallet } from "@/lib/game-coins";

export function ProfileSection({
  name,
  savedName,
  email,
  wallet,
  role,
  joined,
}: {
  name: string;
  savedName: string;
  email: string | null;
  wallet: GameWallet;
  role: string;
  joined: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(savedName);
  const [saving, setSaving] = useState(false);

  return (
    <div className="grid gap-6">
      <Card className="grid gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="bg-accent grid h-16 w-16 place-items-center rounded-md text-xl font-bold text-accent-ink">
            {accountInitials(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-2xl font-bold tracking-tight">{name}</p>
            <p className="mt-1 truncate text-sm text-muted">{email ?? "No email on this device"}</p>
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-surface-2/60 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Email</dt>
            <dd className="mt-1 flex min-w-0 items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">{email ?? "Not signed in"}</span>
              {email ? <CopyButton text={email} label="Copy" compact /> : null}
            </dd>
          </div>
          <div className="rounded-md border border-line bg-surface-2/60 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Account</dt>
            <dd className="mt-1 text-sm font-semibold">{role}</dd>
          </div>
          <div className="rounded-md border border-line bg-surface-2/60 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Studio coins</dt>
            <dd className="mt-1 text-sm font-semibold">
              {formatCoins(wallet.coins)} · {formatCoinBalance(wallet.earned)} earned
            </dd>
          </div>
          <div className="rounded-md border border-line bg-surface-2/60 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Member since</dt>
            <dd className="mt-1 text-sm font-semibold">{joined}</dd>
          </div>
        </dl>
      </Card>

      <Card className="grid max-w-xl gap-3">
        <h2 className="font-semibold">Display name</h2>
        <p className="text-sm leading-6 text-muted">This name appears at the top of the studio and on your product reviews.</p>
        <Field label="Name">
          <TextInput
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={80}
            placeholder="Your name"
          />
        </Field>
        <Button
          className="w-fit"
          loading={saving}
          disabled={!email}
          onClick={async () => {
            setSaving(true);
            try {
              const result = await updateDisplayName(displayName);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success(result.message ?? "Name saved");
              router.refresh();
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving…" : "Save name"}
        </Button>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/settings"
          className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-3 text-sm font-semibold"
        >
          Settings
        </Link>
        <Link
          href="/purchases"
          className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-3 text-sm font-semibold"
        >
          Purchases
        </Link>
      </div>
    </div>
  );
}
