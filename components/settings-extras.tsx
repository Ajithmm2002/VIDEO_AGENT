"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarSync, FileUp } from "lucide-react";
import { createCalendarLink, disableCalendarLink } from "@/lib/actions/creator";
import { importContentCsv } from "@/lib/actions/content";
import { CopyButton } from "@/components/copy-button";
import { Button, Card } from "@/components/ui";

export function CalendarSyncCard({ token, origin, configured, missing }: { token: string | null; origin: string; configured: boolean; missing: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState(token);
  const [busy, setBusy] = useState<"create" | "off" | null>(null);
  const httpsUrl = current ? `${origin}/api/calendar/${current}.ics` : "";
  const webcalUrl = httpsUrl.replace(/^https?:/, "webcal:");

  return (
    <Card className="grid gap-3">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <CalendarSync className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold">Calendar sync</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            See your planned publishing dates in Google Calendar, Apple Calendar, or Outlook. The calendar app checks for changes on its own (Google can take a few hours).
          </p>
        </div>
      </div>
      {missing ? (
        <p className="text-sm text-warn">Run the creator tools SQL in Supabase to turn this on.</p>
      ) : current ? (
        <>
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-surface-2 p-2 pl-3">
            <code className="min-w-0 flex-1 truncate text-xs">{httpsUrl}</code>
            <CopyButton text={httpsUrl} label="Copy calendar link" compact />
          </div>
          <ul className="grid gap-1 text-sm leading-6 text-muted">
            <li>
              <span className="font-medium text-ink">Google Calendar:</span> Other calendars → + → From URL → paste the link.
            </li>
            <li>
              <span className="font-medium text-ink">Apple Calendar / iPhone:</span>{" "}
              <a href={webcalUrl} className="font-medium text-accent hover:underline">
                Subscribe
              </a>{" "}
              or File → New Calendar Subscription.
            </li>
          </ul>
          <p className="text-xs leading-5 text-muted">Keep this link private: anyone who has it can see your planned titles and dates.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              loading={busy === "create"}
              disabled={busy !== null}
              onClick={async () => {
                setBusy("create");
                const result = await createCalendarLink();
                setBusy(null);
                if (!result.ok) return toast.error(result.error);
                setCurrent(result.token ?? null);
                toast.success(result.message ?? "New link ready.");
                router.refresh();
              }}
            >
              Make a new link
            </Button>
            <Button
              variant="ghost"
              loading={busy === "off"}
              disabled={busy !== null}
              onClick={async () => {
                setBusy("off");
                const result = await disableCalendarLink();
                setBusy(null);
                if (!result.ok) return toast.error(result.error);
                setCurrent(null);
                toast.success(result.message ?? "Turned off.");
                router.refresh();
              }}
            >
              Turn off
            </Button>
          </div>
        </>
      ) : (
        <Button
          className="w-fit"
          disabled={!configured}
          loading={busy === "create"}
          onClick={async () => {
            setBusy("create");
            const result = await createCalendarLink();
            setBusy(null);
            if (!result.ok) return toast.error(result.error);
            setCurrent(result.token ?? null);
            toast.success("Calendar link ready. Copy it into your calendar app.");
            router.refresh();
          }}
        >
          Create calendar link
        </Button>
      )}
    </Card>
  );
}

export function CsvImportCard({ configured }: { configured: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");

  return (
    <Card className="grid gap-3">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <FileUp className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold">Import from CSV</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Bring ideas in from a spreadsheet. Only a <span className="font-medium text-ink">title</span> column is required; topic, platform, language, status,
            planned_date, description, tags, and hashtags are read when present. The CSV export from this page imports as is. Up to 300 rows at a time.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label="Choose a CSV file"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (file.size > 2_000_000) return toast.error("Keep the file under 2 MB.");
          setFileName(file.name);
          setBusy(true);
          const result = await importContentCsv(await file.text());
          setBusy(false);
          if (!result.ok) return toast.error(result.error);
          toast.success(result.message ?? "Imported.");
          router.refresh();
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" loading={busy} disabled={!configured} onClick={() => inputRef.current?.click()}>
          {busy ? "Importing…" : "Choose CSV file"}
        </Button>
        {fileName ? <span className="truncate text-sm text-muted">{fileName}</span> : null}
      </div>
    </Card>
  );
}
