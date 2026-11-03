import { afterEach, describe, expect, it, vi } from "vitest";
import { createPageMetadata } from "@/lib/seo-metadata";
import type { SiteConfig } from "@/lib/site-config";

const siteConfig = {
  name: "Studio",
  description: "A creative portfolio.",
  seo: {
    home: { title: "", description: "", image: null },
    defaultImage: {
      id: 10,
      url: "https://cms.example.test/wp-content/uploads/default.jpg",
      width: 1200,
      height: 630,
      alt: "Default share image",
    },
  },
} as SiteConfig;

afterEach(() => vi.unstubAllEnvs());

describe("public SEO metadata", () => {
  it("uses page overrides for title, description, and social image", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://studio.example.test");
    const metadata = createPageMetadata({
      canonical: "/about",
      fallbackTitle: "About",
      siteConfig,
      seo: {
        title: "Meet the Studio",
        description: "The people and practice behind the work.",
        image: {
          id: 11,
          url: "https://cms.example.test/wp-content/uploads/about.jpg",
          width: 1600,
          height: 900,
          alt: "Studio portrait",
        },
      },
    });

    expect(metadata).toMatchObject({
      title: { absolute: "Meet the Studio" },
      description: "The people and practice behind the work.",
      alternates: { canonical: "/about" },
      openGraph: {
        title: "Meet the Studio",
        description: "The people and practice behind the work.",
        url: new URL("https://studio.example.test/about"),
        images: [
          {
            url: "https://cms.example.test/wp-content/uploads/about.jpg",
            width: 1600,
            height: 900,
            alt: "Studio portrait",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        images: [
          expect.objectContaining({ alt: "Studio portrait" }),
        ],
      },
    });
  });

  it("falls back to page and site defaults and the default sharing image", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://studio.example.test");
    const metadata = createPageMetadata({
      canonical: "/contact",
      fallbackTitle: "Contact",
      siteConfig,
      seo: { title: "", description: "", image: null },
    });

    expect(metadata).toMatchObject({
      title: "Contact",
      description: "A creative portfolio.",
      openGraph: {
        siteName: "Studio",
        url: new URL("https://studio.example.test/contact"),
        images: [
          {
            url: "https://cms.example.test/wp-content/uploads/default.jpg",
            alt: "Default share image",
          },
        ],
      },
      twitter: { card: "summary_large_image" },
    });
  });

  it("uses a compact Twitter card when no valid sharing image exists", () => {
    const metadata = createPageMetadata({
      canonical: "/legal",
      fallbackTitle: "Legal",
      siteConfig: {
        ...siteConfig,
        seo: { ...siteConfig.seo, defaultImage: null },
      },
    });

    expect(metadata.twitter).toMatchObject({ card: "summary" });
    expect(metadata.openGraph).not.toHaveProperty("images");
  });
});