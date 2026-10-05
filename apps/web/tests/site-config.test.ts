import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteConfig } from "@/lib/site-config";

const previewConfig = {
  name: "Portfolio Studio",
  description: "A flexible home for selected work.",
  contactEmail: "hello@example.com",
  socialLinks: [],
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
        socialLinks: [
          { label: "Work", href: "https://example.test/work" },
          { label: "Unsafe", href: "javascript:alert(1)" },
          { label: "", href: "https://example.test/empty" },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSiteConfig()).resolves.toEqual({
      name: "Studio Example",
      description: "Independent work.",
      contactEmail: "hello@studio.example",
      socialLinks: [{ label: "Work", href: "https://example.test/work" }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cms.example.test/wp-json/portfolio-studio/v1/settings",
      expect.objectContaining({
        headers: { Accept: "application/json" },
        next: { revalidate: 3600, tags: ["site-settings"] },
      }),
    );
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
