"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PortfolioItem } from "@/lib/types";

export function PortfolioCard({
  item,
  priority = false,
}: {
  item: PortfolioItem;
  priority?: boolean;
}) {
  const t = useTranslations("portfolio");
  const home = useTranslations("home");

  return (
    <article className="portfolio-card">
      <Link
        className="card-image"
        href={`/portfolio/${item.slug}`}
        aria-label={home("viewItem", { name: item.name })}
      >
        <Image
          src={item.cover.src}
          alt={item.cover.alt || item.name}
          fill
          priority={priority}
          sizes="(max-width: 420px) 100vw, (max-width: 760px) 50vw, 33vw"
          className="cover-image"
        />
      </Link>
      <div className="card-copy">
        <h2>
          <Link href={`/portfolio/${item.slug}`}>{item.name}</Link>
        </h2>
        {item.description && (
          <p className="card-description">{item.description}</p>
        )}
        {item.tags.length > 0 && (
          <div className="card-meta" aria-label={t("tags")}>
            {item.tags.map((tag) => (
              <span className="card-tag" key={tag.slug}>
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
