import {
  absoluteUrl,
  type SeoOverrides,
  type SiteConfig,
} from "@/lib/site-config";

export type StructuredDataObject = Record<string, unknown>;

export interface PageStructuredDataOptions {
  canonical: string;
  pageType?: "WebPage" | "ContactPage" | "CollectionPage" | "ProfilePage";
  title: string;
  description?: string;
  image?: SeoOverrides["image"];
}

export function createSiteStructuredData(
  siteConfig: SiteConfig,
): StructuredDataObject {
  const websiteId = absoluteUrl("/#website").toString();
  const personId = absoluteUrl("/#person").toString();
  const person = siteConfig.seo.person;
  const personEntity = person
    ? {
        "@type": "Person",
        "@id": personId,
        name: person.name,
        url: absoluteUrl("/").toString(),
        ...(person.description ? { description: person.description } : {}),
        ...(person.occupation ? { jobTitle: person.occupation } : {}),
        ...(person.image ? { image: person.image.url } : {}),
        ...(person.sameAs.length ? { sameAs: person.sameAs } : {}),
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: absoluteUrl("/").toString(),
        name: siteConfig.name,
        description: siteConfig.description,
        ...(personEntity ? { publisher: { "@id": personId } } : {}),
      },
      ...(personEntity ? [personEntity] : []),
    ],
  };
}

export function createPageStructuredData(
  options: PageStructuredDataOptions,
  siteConfig: SiteConfig,
): StructuredDataObject {
  const canonicalUrl = absoluteUrl(options.canonical).toString();
  const person = siteConfig.seo.person;
  const image = options.image ?? siteConfig.seo.defaultImage;
  const pageType = options.pageType ?? "WebPage";

  return {
    "@context": "https://schema.org",
    "@type": pageType,
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: options.title,
    description: options.description || siteConfig.description,
    isPartOf: { "@id": absoluteUrl("/#website").toString() },
    ...(image
      ? {
          primaryImageOfPage: {
            "@type": "ImageObject",
            "@id": `${canonicalUrl}#primaryimage`,
            url: image.url,
            width: image.width,
            height: image.height,
            caption: image.alt,
          },
        }
      : {}),
    ...(pageType === "ProfilePage" && person
      ? { mainEntity: { "@id": absoluteUrl("/#person").toString() } }
      : {}),
  };
}
