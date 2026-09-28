"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PortfolioImage } from "@/lib/types";

export function ImageGallery({
  images,
  title,
}: {
  images: PortfolioImage[];
  title: string;
}) {
  const t = useTranslations("gallery");
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  if (!activeImage) return null;

  return (
    <div className="image-gallery">
      <div className="gallery-main">
        <Image
          src={activeImage.src}
          alt={activeImage.alt || title}
          fill
          priority
          sizes="(max-width: 760px) 100vw, 86vw"
          className="cover-image"
        />
      </div>
      {images.length > 1 && (
        <div
          className="gallery-thumbnails"
          role="group"
          aria-label={t("images", { name: title })}
        >
          {images.map((image, index) => (
            <button
              className="gallery-thumbnail"
              key={`${image.src}-${index}`}
              type="button"
              aria-label={t("showImage", {
                current: index + 1,
                total: images.length,
              })}
              aria-pressed={activeIndex === index}
              onClick={() => setActiveIndex(index)}
            >
              <Image src={image.src} alt="" fill sizes="92px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
