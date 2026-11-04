import type { Metadata } from "next";
import { CmsPage } from "@/components/cms-page";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { getPortfolioCollection } from "@/lib/portfolio-photos";
import { getPage } from "@/lib/wordpress-page";
import { messages } from "@/messages/en";
import { getSiteConfig } from "@/lib/site-config";
import { createPageMetadata } from "@/lib/seo-metadata";
import { StructuredData } from "@/components/structured-data";
import { createPageStructuredData } from "@/lib/structured-data";

interface PortfolioPageProps {
  searchParams: Promise<{ tag?: string | string[] }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const [page, siteConfig] = await Promise.all([
    getPage("portfolio"),
    getSiteConfig(),
  ]);
  return createPageMetadata({
    canonical: "/portfolio",
    fallbackTitle: page?.title ?? messages.pages.portfolio,
    seo: page?.seo,
    siteConfig,
  });
}

export default async function PortfolioPage({
  searchParams,
}: PortfolioPageProps) {
  const [{ tag }, page, collection, siteConfig] = await Promise.all([
    searchParams,
    getPage("portfolio"),
    getPortfolioCollection(),
    getSiteConfig(),
  ]);
  const requestedTag = Array.isArray(tag) ? (tag[0] ?? "") : (tag ?? "");
  const initialTag = collection.tags.some(
    (item) => item.slug === requestedTag && item.slug !== "all",
  )
    ? requestedTag
    : "";
  const title = page?.seo.title || page?.title || messages.pages.portfolio;

  return (
    <>
      <StructuredData
        data={createPageStructuredData(
          {
            canonical: "/portfolio",
            pageType: "CollectionPage",
            title,
            description: page?.seo.description,
            image: page?.seo.image,
          },
          siteConfig,
        )}
      />
      <CmsPage html={page?.html} title={page?.title ?? messages.pages.portfolio}>
        <section
          aria-label={messages.pages.portfolio}
          className="mt-section mb-section"
        >
          {collection.status === "unavailable" ? (
            <p className="text-body text-muted-foreground">
              {messages.portfolio.unavailable}
            </p>
          ) : (
            <PortfolioGallery
              initialTag={initialTag}
              items={collection.items}
              tags={collection.tags}
            />
          )}
        </section>
      </CmsPage>
    </>
  );
}
