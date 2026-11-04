import type { Metadata } from "next";
import { HomeHero } from "@/components/home-hero";
import { getSiteConfig } from "@/lib/site-config";
import { messages } from "@/messages/en";
import { createPageMetadata } from "@/lib/seo-metadata";
import { StructuredData } from "@/components/structured-data";
import { createPageStructuredData } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  return createPageMetadata({
    canonical: "/",
    fallbackTitle: siteConfig.name || messages.preview.name,
    seo: siteConfig.seo.home,
    siteConfig,
  });
}

export default async function HomePage() {
  const siteConfig = await getSiteConfig();
  const title = siteConfig.seo.home.title || siteConfig.name;
  return (
    <>
      <StructuredData
        data={createPageStructuredData(
          {
            canonical: "/",
            title,
            description: siteConfig.seo.home.description,
            image: siteConfig.seo.home.image,
          },
          siteConfig,
        )}
      />
      <HomeHero eyebrow={messages.pages.portfolio} siteConfig={siteConfig} />
    </>
  );
}
