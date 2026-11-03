import type { Metadata } from "next";
import { CmsPage } from "@/components/cms-page";
import { getPage } from "@/lib/wordpress-page";
import { messages } from "@/messages/en";
import { getSiteConfig } from "@/lib/site-config";
import { createPageMetadata } from "@/lib/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [page, siteConfig] = await Promise.all([
    getPage("contact"),
    getSiteConfig(),
  ]);
  return createPageMetadata({
    canonical: "/contact",
    fallbackTitle: page?.title ?? messages.pages.contact,
    seo: page?.seo,
    siteConfig,
  });
}

export default async function ContactPage() {
  const page = await getPage("contact");

  return (
    <CmsPage
      contactSocialUrls={page?.socialUrls}
      html={page?.html}
      title={page?.title ?? messages.pages.contact}
    />
  );
}
