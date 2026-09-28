import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { PreviewNotice } from "@/components/preview-notice";
import { getContentPage } from "@/lib/cms";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  const { page } = await getContentPage("about");
  return {
    title: page.title,
    description: t("description"),
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const result = await getContentPage("about");

  return (
    <main className="page-shell content-page">
      {result.source === "preview" && <PreviewNotice />}
      <PageHeading eyebrow={t("eyebrow")} title={result.page.title} />
      <div className="content-layout">
        <p className="content-aside">{t("aside")}</p>
        <div
          className="rich-copy"
          dangerouslySetInnerHTML={{ __html: result.page.contentHtml }}
        />
      </div>
    </main>
  );
}
