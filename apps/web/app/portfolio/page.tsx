import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { PortfolioFilter } from "@/components/portfolio-filter";
import { PreviewNotice } from "@/components/preview-notice";
import { getPortfolioCollection } from "@/lib/cms";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("portfolio");
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/portfolio" },
  };
}

export default async function PortfolioPage() {
  const t = await getTranslations("portfolio");
  const collection = await getPortfolioCollection();

  return (
    <main className="page-shell">
      {collection.source === "preview" && <PreviewNotice />}
      <PageHeading eyebrow={t("eyebrow")} title={t("title")} />
      <PortfolioFilter items={collection.items} tags={collection.tags} />
    </main>
  );
}
