import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { PreviewNotice } from "@/components/preview-notice";
import { getContentPage } from "@/lib/cms";
import { getSiteConfig } from "@/lib/site-config";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  const { page } = await getContentPage("contact");
  return {
    title: page.title,
    description: t("description"),
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const result = await getContentPage("contact");
  const siteConfig = await getSiteConfig();

  return (
    <main className="page-shell content-page">
      {result.source === "preview" && <PreviewNotice />}
      <PageHeading eyebrow={t("eyebrow")} title={result.page.title} />
      <div className="content-layout">
        <p className="content-aside">{t("aside")}</p>
        <div>
          <div
            className="rich-copy"
            dangerouslySetInnerHTML={{ __html: result.page.contentHtml }}
          />
          {siteConfig.contactEmail && (
            <a
              className="contact-email"
              href={`mailto:${siteConfig.contactEmail}`}
            >
              {siteConfig.contactEmail}
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
