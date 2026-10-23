import type { Metadata } from "next";
import { CmsPage } from "@/components/cms-page";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { getPortfolioCollection } from "@/lib/portfolio-photos";
import { getPage } from "@/lib/wordpress-page";
import { messages } from "@/messages/en";

interface PortfolioPageProps {
  searchParams: Promise<{ tag?: string | string[] }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("portfolio");
  return { title: page?.title ?? messages.pages.portfolio };
}

export default async function PortfolioPage({
  searchParams,
}: PortfolioPageProps) {
  const [{ tag }, page, collection] = await Promise.all([
    searchParams,
    getPage("portfolio"),
    getPortfolioCollection(),
  ]);
  const requestedTag = Array.isArray(tag) ? (tag[0] ?? "") : (tag ?? "");
  const initialTag = collection.tags.some(
    (item) => item.slug === requestedTag && item.slug !== "all",
  )
    ? requestedTag
    : "";

  return (
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
  );
}
