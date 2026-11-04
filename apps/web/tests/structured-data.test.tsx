import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StructuredData } from "@/components/structured-data";
import {
  createPageStructuredData,
  createSiteStructuredData,
} from "@/lib/structured-data";
import type { SiteConfig } from "@/lib/site-config";

const siteConfig = {
  name: "Portfolio Studio",
  description: "A creative portfolio.",
  seo: {
    home: { title: "", description: "", image: null },
    defaultImage: {
      id: 8,
      url: "https://cms.example.test/wp-content/uploads/share.jpg",
      width: 1200,
      height: 630,
      alt: "Default sharing image",
    },
    person: {
      name: "Alex Morgan",
      description: "Approved professional biography.",
      occupation: "Photographer",
      image: {
        id: 9,
        url: "https://cms.example.test/wp-content/uploads/portrait.jpg",
        width: 1200,
        height: 1600,
        alt: "Portrait of the photographer",
      },
      sameAs: ["https://instagram.com/example"],
    },
  },
} as SiteConfig;

afterEach(() => vi.unstubAllEnvs());

describe("Schema.org structured data", () => {
  it("connects the WebSite publisher to the configured Person", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portfolio.example.test");
    const data = createSiteStructuredData(siteConfig);
    const graph = data["@graph"] as Record<string, unknown>[];

    expect(graph).toEqual([
      {
        "@type": "WebSite",
        "@id": "https://portfolio.example.test/#website",
        url: "https://portfolio.example.test/",
        name: "Portfolio Studio",
        description: "A creative portfolio.",
        publisher: { "@id": "https://portfolio.example.test/#person" },
      },
      {
        "@type": "Person",
        "@id": "https://portfolio.example.test/#person",
        name: "Alex Morgan",
        url: "https://portfolio.example.test/",
        description: "Approved professional biography.",
        jobTitle: "Photographer",
        image: "https://cms.example.test/wp-content/uploads/portrait.jpg",
        sameAs: ["https://instagram.com/example"],
      },
    ]);
  });

  it("omits Person data when no person is configured", () => {
    const config = {
      ...siteConfig,
      seo: { ...siteConfig.seo, person: null },
    } as SiteConfig;
    const data = createSiteStructuredData(config);
    expect(data["@graph"]).toEqual([
      expect.objectContaining({ "@type": "WebSite" }),
    ]);
    expect(JSON.stringify(data)).not.toContain('"@type":"Person"');
  });

  it("links About ProfilePage to Person and uses frontend canonical URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portfolio.example.test");
    const data = createPageStructuredData(
      {
        canonical: "/about",
        pageType: "ProfilePage",
        title: "About Alex Morgan",
        description: "A page about the photographer.",
        image: null,
      },
      siteConfig,
    );
    expect(data).toMatchObject({
      "@type": "ProfilePage",
      "@id": "https://portfolio.example.test/about#webpage",
      url: "https://portfolio.example.test/about",
      name: "About Alex Morgan",
      description: "A page about the photographer.",
      isPartOf: { "@id": "https://portfolio.example.test/#website" },
      mainEntity: { "@id": "https://portfolio.example.test/#person" },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: "https://cms.example.test/wp-content/uploads/share.jpg",
        width: 1200,
        height: 630,
        caption: "Default sharing image",
      },
    });
  });

  it("does not claim Person as the main entity on ordinary pages", () => {
    const data = createPageStructuredData(
      { canonical: "/contact", pageType: "ContactPage", title: "Contact" },
      siteConfig,
    );
    expect(data["@type"]).toBe("ContactPage");
    expect(data).not.toHaveProperty("mainEntity");
  });

  it("escapes script-breaking characters while preserving parseable JSON-LD", () => {
    const markup = renderToStaticMarkup(
      <StructuredData
        data={{
          "@context": "https://schema.org",
          name: "Photographer </script><script>alert(1)</script> & friends",
          lineSeparator: "\u2028",
        }}
      />,
    );
    expect(markup).not.toContain("</script><script>");
    const json = markup.match(/>(.*)<\/script>/)?.[1];
    expect(json).toBeDefined();
    expect(JSON.parse(json!)).toEqual({
      "@context": "https://schema.org",
      name: "Photographer </script><script>alert(1)</script> & friends",
      lineSeparator: "\u2028",
    });
  });
});
