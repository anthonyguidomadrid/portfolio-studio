import type { Metadata } from "next";
import { CmsPage } from "@/components/cms-page";
import { getPage } from "@/lib/wordpress-page";
import { messages } from "@/messages/en";
import { getSiteConfig } from "@/lib/site-config";
import { createPageMetadata } from "@/lib/seo-metadata";
import { StructuredData } from "@/components/structured-data";
import { createPageStructuredData } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const [page, siteConfig] = await Promise.all([
    getPage("about"),
    getSiteConfig(),
  ]);
  return createPageMetadata({
    canonical: "/about",
    fallbackTitle: page?.title ?? messages.pages.about,
    seo: page?.seo,
    siteConfig,
  });
}

export default async function AboutPage() {
  const [page, siteConfig] = await Promise.all([
    getPage("about"),
    getSiteConfig(),
  ]);
  const title = page?.seo.title || page?.title || messages.pages.about;

  return (
    <>
      <StructuredData
        data={createPageStructuredData(
          {
            canonical: "/about",
            pageType: "ProfilePage",
            title,
            description: page?.seo.description,
            image: page?.seo.image,
          },
          siteConfig,
        )}
      />
      <CmsPage
        html={page?.html}
        showBookingCta
        title={page?.title ?? messages.pages.about}
      />
    </>
  );
}
