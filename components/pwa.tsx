"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import { Button, Card } from "@/components/ui";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferredPrompt: InstallPrompt | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPrompt;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Registers the service worker in production builds only, so local development is never cached. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Installing is optional; the site works without it.
    });
  }, []);
  return null;
}

function standalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function InstallAppCard() {
  const prompt = useSyncExternalStore(subscribe, () => deferredPrompt, () => null);
  const installed = useSyncExternalStore(subscribe, standalone, () => false);
  const ios = useSyncExternalStore(() => () => {}, isIos, () => false);
  const [busy, setBusy] = useState(false);

  return (
    <Card className="grid gap-3">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Smartphone className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold">Install the app</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Add Content Studio to your home screen or dock. It opens full screen, like a regular app, and updates by itself.
          </p>
        </div>
      </div>
      {installed ? (
        <p className="text-sm font-medium text-ok">Installed. You are using the app right now.</p>
      ) : prompt ? (
        <Button
          className="w-fit"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await prompt.prompt();
              await prompt.userChoice;
            } finally {
              deferredPrompt = null;
              notify();
              setBusy(false);
            }
          }}
        >
          <Download className="h-4 w-4" aria-hidden />
          Install app
        </Button>
      ) : ios ? (
        <p className="flex flex-wrap items-center gap-1.5 text-sm leading-6 text-muted">
          In Safari, tap <Share className="inline h-4 w-4 text-ink" aria-label="Share" /> Share, then <span className="font-medium text-ink">Add to Home Screen</span>.
        </p>
      ) : (
        <p className="text-sm leading-6 text-muted">
          In Chrome or Edge, open the browser menu and choose <span className="font-medium text-ink">Install app</span> (or{" "}
          <span className="font-medium text-ink">Add to Home screen</span> on Android).
        </p>
      )}
    </Card>
  );
}
