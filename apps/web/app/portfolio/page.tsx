import type { Metadata } from "next";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { getPortfolioCollection } from "@/lib/portfolio-photos";
import { messages } from "@/messages/en";

interface PortfolioPageProps {
  searchParams: Promise<{ tag?: string | string[] }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: messages.pages.portfolio };
}

export default async function PortfolioPage({
  searchParams,
}: PortfolioPageProps) {
  const [{ tag }, collection] = await Promise.all([
    searchParams,
    getPortfolioCollection(),
  ]);
  const requestedTag = Array.isArray(tag) ? (tag[0] ?? "") : (tag ?? "");
  const initialTag = collection.tags.some(
    (item) => item.slug === requestedTag && item.slug !== "all",
  )
    ? requestedTag
    : "";

  return (
    <main className="mx-auto w-full max-w-content flex-1 px-page-gutter py-section">
      <h1 className="mb-8 mt-0 text-heading-1">{messages.pages.portfolio}</h1>
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
    </main>
  );
}
