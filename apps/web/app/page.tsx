import Image from "next/image";
import Link from "next/link";
import { PortfolioCard } from "@/components/portfolio-card";
import { PreviewNotice } from "@/components/preview-notice";
import { VideoEmbed } from "@/components/video-embed";
import { getPortfolioCollection } from "@/lib/cms";
import { getSiteConfig } from "@/lib/site-config";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");
  const siteConfig = await getSiteConfig();
  const collection = await getPortfolioCollection();
  const featured =
    collection.items.find((item) => item.slug === "videobook") ??
    collection.items.find((item) =>
      item.tags.some((tag) => tag.slug === "video"),
    ) ??
    collection.items[0];
  const selectedWork = collection.items
    .filter((item) => item.slug !== featured?.slug)
    .slice(0, 3);

  return (
    <main className="page-shell">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="eyebrow">{siteConfig.description}</p>
          <h1 id="home-title">
            {t("heroFirst")}
            <br />
            {t("heroSecond")}
          </h1>
          <Link className="text-link" href="/portfolio">
            {t("explore")} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="hero-mark" aria-hidden="true">
          {siteConfig.name.charAt(0)}
          <span>.</span>
        </div>
      </section>

      {collection.source === "preview" && <PreviewNotice />}

      {featured ? (
        <section className="featured-section" aria-labelledby="featured-title">
          <div className="section-heading">
            <p className="eyebrow">{t("featured")}</p>
            <h2 id="featured-title">{featured.name}</h2>
          </div>
          <Link
            className="featured-work"
            href={`/portfolio/${featured.slug}`}
            aria-label={t("viewItem", { name: featured.name })}
          >
            <Image
              src={featured.cover.src}
              alt={featured.cover.alt}
              fill
              priority
              sizes="(max-width: 760px) 100vw, 86vw"
              className="cover-image"
            />
            <span className="featured-caption">
              <span>
                {featured.slug === "videobook" ? "Videobook" : featured.name}
              </span>
              <span aria-hidden="true">↗</span>
            </span>
          </Link>
          {featured.videoUrl && (
            <VideoEmbed url={featured.videoUrl} title={featured.name} />
          )}
        </section>
      ) : (
        <section className="empty-state" aria-live="polite">
          <h2>{t("emptyTitle")}</h2>
          <p>{t("emptyDescription")}</p>
        </section>
      )}

      <section className="selected-section" aria-labelledby="selected-title">
        <div className="section-heading section-heading-row">
          <div>
            <p className="eyebrow">{t("selectedEyebrow")}</p>
            <h2 id="selected-title">{t("selectedTitle")}</h2>
          </div>
          <Link className="text-link" href="/portfolio">
            {t("viewAll")} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {selectedWork.length > 0 ? (
          <div className="portfolio-grid portfolio-grid-home">
            {selectedWork.map((item, index) => (
              <PortfolioCard key={item.id} item={item} priority={index === 0} />
            ))}
          </div>
        ) : (
          <p className="quiet-note">{t("moreWork")}</p>
        )}
      </section>

      <section className="contact-band" aria-label={t("contactEyebrow")}>
        <p className="eyebrow">{t("contactEyebrow")}</p>
        <Link className="contact-band-link" href="/contact">
          {t("contactAction")} <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
