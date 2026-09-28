import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/components/image-gallery";
import { PreviewNotice } from "@/components/preview-notice";
import { VideoEmbed } from "@/components/video-embed";
import { getPortfolioCollection } from "@/lib/cms";
import { absoluteUrl, getSiteConfig } from "@/lib/site-config";
import { getTranslations } from "next-intl/server";

type PortfolioDetailProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const collection = await getPortfolioCollection();
  return collection.items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PortfolioDetailProps): Promise<Metadata> {
  const t = await getTranslations("portfolio");
  const { slug } = await params;
  const collection = await getPortfolioCollection();
  const siteConfig = await getSiteConfig();
  const item = collection.items.find((entry) => entry.slug === slug);
  if (!item) return { title: t("notFound") };

  return {
    title: item.name,
    description:
      item.description || `${item.name} in the ${siteConfig.name} portfolio.`,
    alternates: { canonical: `/portfolio/${item.slug}` },
    openGraph: {
      title: item.name,
      description: item.description || siteConfig.description,
      url: absoluteUrl(`/portfolio/${item.slug}`),
      images: [{ url: item.cover.src, alt: item.cover.alt || item.name }],
    },
  };
}

export default async function PortfolioDetailPage({
  params,
}: PortfolioDetailProps) {
  const t = await getTranslations("portfolio");
  const { slug } = await params;
  const collection = await getPortfolioCollection();
  const item = collection.items.find((entry) => entry.slug === slug);
  if (!item) notFound();

  return (
    <main className="page-shell">
      {collection.source === "preview" && <PreviewNotice />}
      <header className="project-heading">
        <div>
          <p className="eyebrow">
            {t("detailEyebrow")} /{" "}
            {item.tags.map((tag) => tag.name).join(" / ")}
          </p>
          <h1>{item.name}</h1>
        </div>
        {item.credits && <p className="project-credits">{item.credits}</p>}
      </header>
      {item.description && (
        <p className="project-description">{item.description}</p>
      )}
      <ImageGallery
        images={item.gallery.length ? item.gallery : [item.cover]}
        title={item.name}
      />
      {item.videoUrl && (
        <section
          className="video-section"
          aria-label={t("videoLabel", { name: item.name })}
        >
          <VideoEmbed url={item.videoUrl} title={item.name} />
        </section>
      )}
      {item.tags.some((tag) => tag.slug === "video") && !item.videoUrl && (
        <section
          className="video-section"
          aria-label={t("videoLabel", { name: item.name })}
        >
          <VideoEmbed title={item.name} />
        </section>
      )}
      <div className="card-meta" aria-label={t("tags")}>
        {item.tags.map((tag) => (
          <span className="card-tag" key={tag.slug}>
            {tag.name}
          </span>
        ))}
      </div>
      <Link className="back-link" href="/portfolio">
        ← {t("back")}
      </Link>
    </main>
  );
}
