import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import VideosPage from "@/app/videos/page";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Videos page integration", () => {
  it("renders the published WordPress videos page", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = new URL(String(input));
      return Response.json(
        url.pathname.endsWith("/portfolio-studio/v1/settings")
          ? { name: "Portfolio Studio" }
          : [
              {
                slug: "videos",
                title: { rendered: "Videos" },
                content: { rendered: "<p>Selected video work.</p>" },
              },
            ],
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const markup = renderToStaticMarkup(await VideosPage());

    expect(markup).toContain('aria-label="Videos"');
    expect(markup).toContain("Selected video work.");
    expect(markup).toContain("Have a project in mind?");
    expect(markup).toContain('href="/contact"');
    expect(markup).toContain("Contact for booking");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchParams: expect.any(URLSearchParams),
      }),
      expect.anything(),
    );
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestedUrl.searchParams.get("slug")).toBe("videos");
  });

  it("shows the unavailable state when WordPress has no Videos page", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation(async (input) => {
        const url = new URL(String(input));
        return Response.json(
          url.pathname.endsWith("/portfolio-studio/v1/settings")
            ? { name: "Portfolio Studio" }
            : [],
        );
      }),
    );

    const markup = renderToStaticMarkup(await VideosPage());

    expect(markup).toContain('aria-label="Videos"');
    expect(markup).toContain("This page is currently unavailable.");
  });
});
