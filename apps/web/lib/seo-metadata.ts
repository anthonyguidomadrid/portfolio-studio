import type { Metadata } from "next";
import { absoluteUrl, type SeoOverrides, type SiteConfig } from "@/lib/site-config";

interface PageMetadataOptions {
  canonical: string;
  fallbackTitle: string;
  seo?: SeoOverrides;
  siteConfig: SiteConfig;
}

export function createPageMetadata({
  canonical,
  fallbackTitle,
  seo,
  siteConfig,
}: PageMetadataOptions): Metadata {
  const title = seo?.title || fallbackTitle || siteConfig.name;
  const description = seo?.description || siteConfig.description;
  const image = seo?.image ?? siteConfig.seo.defaultImage;
  const imageUrl = image?.url;
  const images = imageUrl
    ? [
        {
          url: imageUrl,
          width: image.width,
          height: image.height,
          alt: image.alt,
        },
      ]
    : undefined;

  return {
    title: seo?.title ? { absolute: title } : title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title,
      description,
      url: absoluteUrl(canonical),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(images ? { images } : {}),
    },
  };
}