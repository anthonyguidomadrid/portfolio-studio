import { getYouTubeVideoId } from "@/lib/youtube";
import { messages } from "@/messages/en";

const MAX_VIDEO_START_SECONDS = 43200;

export interface NotFoundBackgroundImage {
  id: number;
  url: string;
  width: number;
  height: number;
}

export interface SeoImage extends NotFoundBackgroundImage {
  alt: string;
}

export interface SeoOverrides {
  title: string;
  description: string;
  image: SeoImage | null;
}

export interface SiteSeoSettings {
  home: SeoOverrides;
  defaultImage: SeoImage | null;
}

export interface SiteConfig {
  name: string;
  description: string;
  contactEmail: string;
  homeVideoId: string;
  homeVideoStart: number;
  notFoundBackgroundImage?: NotFoundBackgroundImage | null;
  seo: SiteSeoSettings;
  socialLinks: { label: string; href: string }[];
  socialUrls: SocialUrls;
  navigation: typeof navigationItems;
}

export interface SocialUrls {
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  pinterest: string;
  tumblr: string;
  flickr: string;
}

export const ROUTES = {
  home: "/",
  about: "/about",
  portfolio: "/portfolio",
  videos: "/videos",
  contact: "/contact",
} as const;

export const navigationItems = [
  { key: "home", href: ROUTES.home },
  { key: "about", href: ROUTES.about },
  { key: "portfolio", href: ROUTES.portfolio },
  { key: "videos", href: ROUTES.videos },
  { key: "contact", href: ROUTES.contact },
] as const;

const previewSiteConfig: SiteConfig = {
  name: messages.preview.name,
  description: messages.preview.description,
  contactEmail: "hello@example.com",
  homeVideoId: "",
  homeVideoStart: 0,
  notFoundBackgroundImage: null,
  seo: {
    home: { title: "", description: "", image: null },
    defaultImage: null,
  },
  socialLinks: [],
  socialUrls: {
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
    pinterest: "",
    tumblr: "",
    flickr: "",
  },
  navigation: navigationItems,
};

function validExternalUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeVideoStart(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.floor(value), 0), MAX_VIDEO_START_SECONDS);
}

function normalizeNotFoundImage(
  value: unknown,
): NotFoundBackgroundImage | null {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  const image = value as Record<string, unknown>;
  if (
    !Number.isSafeInteger(image.id) ||
    (image.id as number) < 1 ||
    !Number.isSafeInteger(image.width) ||
    (image.width as number) < 1 ||
    !Number.isSafeInteger(image.height) ||
    (image.height as number) < 1 ||
    typeof image.url !== "string"
  )
    return null;

  try {
    const url = new URL(image.url);
    const cms = new URL(process.env.CMS_URL!.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.origin !== cms.origin ||
      url.username ||
      url.password ||
      !url.pathname.startsWith("/wp-content/uploads/")
    )
      return null;
    return {
      id: image.id as number,
      url: url.toString(),
      width: image.width as number,
      height: image.height as number,
    };
  } catch {
    return null;
  }
}

export function normalizeSeoImage(value: unknown): SeoImage | null {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  const image = value as Record<string, unknown>;
  const normalized = normalizeNotFoundImage(image);
  if (!normalized || typeof image.alt !== "string") return null;
  return {
    ...normalized,
    alt: image.alt.trim().slice(0, 500),
  };
}

function normalizeSeoOverrides(value: unknown): SeoOverrides {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { title: "", description: "", image: null };
  }
  const fields = value as Record<string, unknown>;
  return {
    title:
      typeof fields.title === "string" ? fields.title.trim().slice(0, 200) : "",
    description:
      typeof fields.description === "string"
        ? fields.description.trim().slice(0, 500)
        : "",
    image: normalizeSeoImage(fields.image),
  };
}

function normalizeSiteSeo(value: unknown): SiteSeoSettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return previewSiteConfig.seo;
  }
  const fields = value as Record<string, unknown>;
  return {
    home: normalizeSeoOverrides(fields.home),
    defaultImage: normalizeSeoImage(fields.defaultImage),
  };
}

function normalizeSiteConfig(value: unknown): SiteConfig | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const fields = value as Record<string, unknown>;
  if (typeof fields.name !== "string" || !fields.name.trim()) return undefined;

  const socialLinks = Array.isArray(fields.socialLinks)
    ? fields.socialLinks.flatMap((value) => {
        if (typeof value !== "object" || value === null) return [];
        const link = value as Record<string, unknown>;
        const href = validExternalUrl(link.href);
        return typeof link.label === "string" && link.label.trim() && href
          ? [{ label: link.label.trim(), href }]
          : [];
      })
    : [];

  const socialUrls: SocialUrls = {
    instagram: validExternalUrl(fields.instagramUrl) ?? "",
    facebook: validExternalUrl(fields.facebookUrl) ?? "",
    twitter: validExternalUrl(fields.twitterUrl) ?? "",
    youtube: validExternalUrl(fields.youtubeUrl) ?? "",
    pinterest: validExternalUrl(fields.pinterestUrl) ?? "",
    tumblr: validExternalUrl(fields.tumblrUrl) ?? "",
    flickr: validExternalUrl(fields.flickrUrl) ?? "",
  };

  return {
    name: fields.name.trim().slice(0, 120),
    navigation: navigationItems,
    description:
      typeof fields.description === "string"
        ? fields.description.trim().slice(0, 320)
        : previewSiteConfig.description,
    contactEmail:
      typeof fields.contactEmail === "string" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.contactEmail)
        ? fields.contactEmail.trim()
        : "",
    homeVideoId: getYouTubeVideoId(fields.homeVideoUrl) ?? "",
    homeVideoStart: normalizeVideoStart(fields.homeVideoStart),
    notFoundBackgroundImage: normalizeNotFoundImage(
      fields.notFoundBackgroundImage,
    ),
    seo: normalizeSiteSeo(fields.seo),
    socialLinks,
    socialUrls,
  };
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const cmsUrl = process.env.CMS_URL?.trim().replace(/\/+$/, "");
  if (!cmsUrl) return previewSiteConfig;

  try {
    const response = await fetch(
      `${cmsUrl}/wp-json/portfolio-studio/v1/settings`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: false, tags: ["site-settings"] },
      },
    );
    if (!response.ok)
      throw new Error(
        `WordPress site settings responded with ${response.status}.`,
      );

    const settings = normalizeSiteConfig(await response.json());
    if (!settings)
      throw new Error("WordPress site settings response had an invalid shape.");
    return settings;
  } catch (error) {
    console.error(
      "WordPress site settings request failed; using preview configuration.",
      error,
    );
    return previewSiteConfig;
  }
}

export function getSiteUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    try {
      return new URL(configuredUrl);
    } catch {
      console.warn(
        "NEXT_PUBLIC_SITE_URL is not a valid URL; using localhost for metadata.",
      );
    }
  }

  return new URL("http://localhost:3000");
}

export function absoluteUrl(path: string): URL {
  return new URL(path, getSiteUrl());
}
