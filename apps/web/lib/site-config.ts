export interface SiteConfig {
  name: string;
  description: string;
  contactEmail: string;
  socialLinks: { label: string; href: string }[];
}

const previewSiteConfig: SiteConfig = {
  name: "Portfolio Studio",
  description: "A flexible home for selected work.",
  contactEmail: "hello@example.com",
  socialLinks: [],
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

  return {
    name: fields.name.trim().slice(0, 120),
    description:
      typeof fields.description === "string"
        ? fields.description.trim().slice(0, 320)
        : previewSiteConfig.description,
    contactEmail:
      typeof fields.contactEmail === "string" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.contactEmail)
        ? fields.contactEmail.trim()
        : "",
    socialLinks,
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
        next: { revalidate: 3600, tags: ["site-settings"] },
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
