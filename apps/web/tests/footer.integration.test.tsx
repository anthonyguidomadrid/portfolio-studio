// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/footer";
import { getSiteConfig } from "@/lib/site-config";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("SiteFooter integration", () => {
  it("renders CMS platform URLs as labeled brand icons with email and copyright", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            name: "Studio Example",
            description: "An independent creative portfolio.",
            contactEmail: "hello@studio.example",
            instagramUrl: "https://instagram.com/studio",
            facebookUrl: "https://facebook.com/studio",
            twitterUrl: "https://x.com/studio",
            youtubeUrl: "https://youtube.com/@studio",
            pinterestUrl: "https://pinterest.com/studio",
            tumblrUrl: "https://tumblr.com/studio",
            flickrUrl: "https://flickr.com/studio",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const siteConfig = await getSiteConfig();
    render(
      <SiteFooter
        contactEmail={siteConfig.contactEmail}
        name={siteConfig.name}
        socialUrls={siteConfig.socialUrls}
      />,
    );

    expect(
      screen
        .getByRole("link", { name: "hello@studio.example" })
        .getAttribute("href"),
    ).toBe("mailto:hello@studio.example");

    const socialNavigation = screen.getByRole("navigation", {
      name: "Social media",
    });
    const expectedLinks = [
      ["Instagram", "https://instagram.com/studio"],
      ["Facebook", "https://facebook.com/studio"],
      ["X (Twitter)", "https://x.com/studio"],
      ["YouTube", "https://youtube.com/@studio"],
      ["Pinterest", "https://pinterest.com/studio"],
      ["Tumblr", "https://tumblr.com/studio"],
      ["Flickr", "https://flickr.com/studio"],
    ];

    for (const [label, href] of expectedLinks) {
      const link = within(socialNavigation).getByRole("link", { name: label });
      expect(link.getAttribute("href")).toBe(href);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.className).toContain("size-11");
    }

    expect(
      screen.getByText(`© ${new Date().getFullYear()} Studio Example`),
    ).toBeTruthy();
  });

  it("omits social navigation and email when every optional URL is empty", () => {
    render(
      <SiteFooter
        contactEmail=""
        name="Preview Site"
        socialUrls={{
          instagram: "",
          facebook: "",
          twitter: "",
          youtube: "",
          pinterest: "",
          tumblr: "",
          flickr: "",
        }}
      />,
    );

    expect(
      screen.queryByRole("navigation", { name: "Social media" }),
    ).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(
      screen.getByText(`© ${new Date().getFullYear()} Preview Site`),
    ).toBeTruthy();
  });
});
