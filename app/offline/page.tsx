import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6 text-center text-ink">
      <div className="max-w-sm">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl bg-accent text-sm font-bold text-accent-ink">CS</div>
        <h1 className="text-xl font-semibold">You are offline</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Content Studio needs a connection to load your work. Check your internet, then try again. Unsaved content drafts stay on this device.
        </p>
        <a href="/dashboard" className="mt-6 inline-flex min-h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink">
          Try again
        </a>
      </div>
    </main>
  );
}
