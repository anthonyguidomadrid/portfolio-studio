import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteConfig, navigationItems } from "@/lib/site-config";

const previewConfig = {
  name: "STUDIO PORTFOLIO",
  description: "A flexible home for selected work.",
  contactEmail: "hello@example.com",
  homeVideoId: "",
  homeVideoStart: 0,
  notFoundBackgroundImage: null,
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

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getSiteConfig", () => {
  it("uses generic preview settings when CMS_URL is not set", async () => {
    vi.stubEnv("CMS_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSiteConfig()).resolves.toEqual(previewConfig);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches and normalizes the public WordPress settings", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test/");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      response({
        name: "  Studio Example  ",
        description: "  Independent work.  ",
        contactEmail: "hello@studio.example",
        homeVideoUrl: "https://youtu.be/dQw4w9WgXcQ",
        homeVideoStart: 90,
        socialLinks: [
          { label: "Work", href: "https://example.test/work" },
          { label: "Unsafe", href: "javascript:alert(1)" },
          { label: "", href: "https://example.test/empty" },
        ],
        instagramUrl: "https://instagram.com/example",
        facebookUrl: "http://facebook.com/example",
        twitterUrl: "javascript:alert(1)",
        youtubeUrl: "",
        pinterestUrl: "https://pinterest.com/example",
        tumblrUrl: null,
        flickrUrl: "https://flickr.com/example",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSiteConfig()).resolves.toEqual({
      name: "Studio Example",
      description: "Independent work.",
      contactEmail: "hello@studio.example",
      homeVideoId: "dQw4w9WgXcQ",
      homeVideoStart: 90,
      notFoundBackgroundImage: null,
      socialLinks: [{ label: "Work", href: "https://example.test/work" }],
      socialUrls: {
        instagram: "https://instagram.com/example",
        facebook: "http://facebook.com/example",
        twitter: "",
        youtube: "",
        pinterest: "https://pinterest.com/example",
        tumblr: "",
        flickr: "https://flickr.com/example",
      },
      navigation: navigationItems,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cms.example.test/wp-json/portfolio-studio/v1/settings",
      expect.objectContaining({
        headers: { Accept: "application/json" },
        next: { revalidate: 3600, tags: ["site-settings"] },
      }),
    );
  });

  it("accepts a valid public CMS 404 background", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test/");
    const image = { id: 201, url: "https://cms.example.test/wp-content/uploads/background.jpg", width: 1600, height: 1000 };
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(response({ name: "Studio", notFoundBackgroundImage: image })));
    await expect(getSiteConfig()).resolves.toMatchObject({ notFoundBackgroundImage: image });
  });

  it.each([
    undefined, null, {}, [],
    { id: 1, url: "https://external.example.test/wp-content/uploads/a.jpg", width: 800, height: 600 },
    { id: 1, url: "https://cms.example.test/private/a.jpg", width: 800, height: 600 },
    { id: 1, url: "https://user:password@cms.example.test/wp-content/uploads/a.jpg", width: 800, height: 600 },
    { id: 1, url: "javascript:alert(1)", width: 800, height: 600 },
    { id: 1, url: "https://cms.example.test/wp-content/uploads/a.jpg", width: 0, height: 600 },
    { id: "1", url: "https://cms.example.test/wp-content/uploads/a.jpg", width: 800, height: 600 },
  ])("ignores invalid or missing 404 image %p without losing site settings", async (image) => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(response({ name: "Studio", notFoundBackgroundImage: image })));
    await expect(getSiteConfig()).resolves.toMatchObject({ name: "Studio", notFoundBackgroundImage: null });
  });

  it.each([
    [0, 0],
    [90, 90],
    [12.9, 12],
    [-5, 0],
    [999999, 43200],
    ["90", 0],
    [null, 0],
    [Number.NaN, 0],
    [undefined, 0],
  ])("normalizes homeVideoStart %p to %p", async (input, expected) => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(response({ name: "Site", homeVideoStart: input })),
    );

    await expect(getSiteConfig()).resolves.toMatchObject({
      homeVideoStart: expected,
    });
  });

  it("uses preview settings when WordPress is unavailable", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")),
    );

    await expect(getSiteConfig()).resolves.toEqual(previewConfig);
  });

  it("rejects invalid settings payloads and falls back", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(response({ name: "  " })),
    );

    await expect(getSiteConfig()).resolves.toEqual(previewConfig);
  });
});
