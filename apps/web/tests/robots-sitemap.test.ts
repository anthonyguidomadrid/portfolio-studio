import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("search engine discovery", () => {
  it("allows search engines to crawl public pages while blocking API routes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://studio.example.test");

    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: "/api/" },
      sitemap: "https://studio.example.test/sitemap.xml",
    });
  });

  it("lists public content pages, including the legal page", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://studio.example.test");

    expect(sitemap().map(({ url }) => url)).toEqual([
      "https://studio.example.test/",
      "https://studio.example.test/about",
      "https://studio.example.test/portfolio",
      "https://studio.example.test/videos",
      "https://studio.example.test/contact",
      "https://studio.example.test/legal",
    ]);
  });
});
