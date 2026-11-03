import type { Metadata } from "next";
import { CmsPage } from "@/components/cms-page";
import { getPage } from "@/lib/wordpress-page";
import { messages } from "@/messages/en";
import { getSiteConfig } from "@/lib/site-config";
import { createPageMetadata } from "@/lib/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [page, siteConfig] = await Promise.all([
    getPage("videos"),
    getSiteConfig(),
  ]);
  return createPageMetadata({
    canonical: "/videos",
    fallbackTitle: page?.title ?? messages.pages.videos,
    seo: page?.seo,
    siteConfig,
  });
}

export default async function VideosPage() {
  const page = await getPage("videos");

  return (
    <CmsPage
      html={page?.html}
      showBookingCta
      title={page?.title ?? messages.pages.videos}
    />
  );
}
