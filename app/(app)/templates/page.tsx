import type { Metadata } from "next";
import { TemplateLibrary } from "@/components/template-library";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Create"
        title="Templates"
        description="Proven hooks, titles, captions, and calls to action. Type your topic once and every template fills it in, ready to copy."
      />
      <TemplateLibrary />
    </div>
  );
}
