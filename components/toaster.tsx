"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function AppToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      toastOptions={{
        className: "rounded-2xl border border-line bg-surface text-ink shadow-[var(--shadow)]",
      }}
    />
  );
}
