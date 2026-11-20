import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { Card } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="max-w-md text-center">
        <div className="flex justify-center">
          <BrandMark href="/dashboard" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">This page is not here</h1>
        <p className="mt-2 text-sm leading-6 text-muted">The link may be old, or the item may have been deleted.</p>
        <Link href="/dashboard" className="mt-5 inline-flex rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink">
          Back to the dashboard
        </Link>
      </Card>
    </main>
  );
}
