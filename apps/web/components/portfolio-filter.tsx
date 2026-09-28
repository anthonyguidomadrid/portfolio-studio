"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PortfolioCard } from "@/components/portfolio-card";
import type { PortfolioItem, PortfolioTag } from "@/lib/types";

interface PortfolioFilterProps {
  items: PortfolioItem[];
  tags: PortfolioTag[];
}

export function PortfolioFilter({ items, tags }: PortfolioFilterProps) {
  const t = useTranslations("portfolio");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const visibleItems =
    selectedTag === "all"
      ? items
      : items.filter((item) =>
          item.tags.some((tag) => tag.slug === selectedTag),
        );

  return (
    <>
      <div className="filter-bar" role="group" aria-label={t("filterLabel")}>
        {[{ slug: "all", name: t("allWork") }, ...tags].map((tag) => (
          <button
            className="filter-button"
            key={tag.slug}
            type="button"
            aria-pressed={selectedTag === tag.slug}
            onClick={() => setSelectedTag(tag.slug)}
          >
            {tag.name}
          </button>
        ))}
      </div>
      {visibleItems.length ? (
        <div className="portfolio-grid" aria-live="polite">
          {visibleItems.map((item, index) => (
            <PortfolioCard key={item.id} item={item} priority={index === 0} />
          ))}
        </div>
      ) : (
        <p className="portfolio-empty" role="status">
          {t("empty")}
        </p>
      )}
    </>
  );
}
