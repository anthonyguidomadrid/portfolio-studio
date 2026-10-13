import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Home page integration", () => {
  it("renders every public value returned by the WordPress settings API", async () => {
    const cmsSettings = {
      name: "Example Site",
      description: "Example profile description",
      contactEmail: "contact@example.test",
      socialLinks: [
        { label: "Social link one", href: "https://social.example.test/one" },
        { label: "Social link two", href: "https://social.example.test/two" },
      ],
      instagramUrl: "https://instagram.example.test/profile",
      facebookUrl: "https://facebook.example.test/profile",
      twitterUrl: "https://x.example.test/profile",
      youtubeUrl: "https://youtube.example.test/profile",
      pinterestUrl: "https://pinterest.example.test/profile",
      tumblrUrl: "https://tumblr.example.test/profile",
      flickrUrl: "https://flickr.example.test/profile",
    };

    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify(cmsSettings), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("<h1");
    expect(markup).toContain(cmsSettings.name);
    expect(markup).toContain(cmsSettings.description);
    expect(markup).not.toContain("Elsewhere");
    expect(markup).not.toContain("Development theme preview");
  });

  it("renders the hero with the site name and description over the overlay", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            name: "Example Site",
            description: "Example profile description",
            homeVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("Example Site");
    expect(markup).toContain("Example profile description");
    expect(markup).toContain("Portfolio");
    expect(markup).toContain("bg-primary/60");
    expect(markup).not.toContain("Coming soon.");
  });

  it("keeps the hero text when the home video value is not a YouTube video", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            name: "Example Site",
            homeVideoUrl: "https://evil.example/watch?v=dQw4w9WgXcQ",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("Example Site");
    expect(markup).toContain("A flexible home for selected work.");
    expect(markup).not.toContain("evil.example");
    expect(markup).not.toContain("Coming soon.");
  });
});
