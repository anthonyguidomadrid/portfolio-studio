import type { Metadata } from "next";
import { CmsPage } from "@/components/cms-page";
import { getPage } from "@/lib/wordpress-page";
import { messages } from "@/messages/en";
import { getSiteConfig } from "@/lib/site-config";
import { createPageMetadata } from "@/lib/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [page, siteConfig] = await Promise.all([
    getPage("legal"),
    getSiteConfig(),
  ]);
  return createPageMetadata({
    canonical: "/legal",
    fallbackTitle: page?.title ?? messages.pages.legal,
    seo: page?.seo,
    siteConfig,
  });
}

export default async function LegalPage() {
  const page = await getPage("legal");
  return (
    <CmsPage html={page?.html} title={page?.title ?? messages.pages.legal} />
  );
}
