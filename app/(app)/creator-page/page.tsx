import type { Metadata } from "next";
import { CreatorPageEditor } from "@/components/creator-page-editor";
import { PageHeader } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { emptyPage } from "@/lib/creator-page";
import { getCreatorSettings, listCreatorLinks } from "@/lib/queries";
import { requestOrigin } from "@/lib/session";

export const metadata: Metadata = { title: "Creator page" };

export default async function CreatorPageSettings() {
  const [creator, links, origin] = await Promise.all([getCreatorSettings(), listCreatorLinks(), requestOrigin()]);
  return (
    <div>
      <PageHeader
        eyebrow="Grow"
        title="Creator page"
        description="One public link for your Instagram or YouTube bio: your media kit for brands, plus your important links with click counts."
      />
      <CreatorPageEditor
        origin={origin}
        configured={isSupabaseConfigured()}
        missing={creator.missing || links.missing}
        handle={creator.settings?.public_handle ?? ""}
        isPublic={creator.settings?.page_public ?? false}
        page={creator.settings?.page ?? emptyPage()}
        links={links.links}
      />
    </div>
  );
}
