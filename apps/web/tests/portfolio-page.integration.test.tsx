import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import PortfolioPage from "@/app/portfolio/page";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Portfolio page integration", () => {
  it("renders photos and the initial tag selected from the URL", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 10,
              slug: "studio-portrait",
              title: "Studio Portrait",
              displayOrder: 1,
              image: {
                id: 110,
                url: "https://cms.example.test/wp-content/uploads/studio-portrait.jpg",
                width: 800,
                height: 1200,
                alt: "Model in the studio",
                caption: "Studio session",
              },
              tags: [{ id: 1, slug: "editorial", name: "Editorial" }],
            },
          ],
          tags: [{ id: 1, slug: "editorial", name: "Editorial" }],
          total: 1,
          totalPages: 1,
          page: 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const markup = renderToStaticMarkup(
      await PortfolioPage({ searchParams: Promise.resolve({ tag: "editorial" }) }),
    );

    expect(markup).toContain("Studio Portrait");
    expect(markup).toContain("Editorial");
    expect(markup).toContain("Model in the studio");
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).not.toContain("Coming soon.");
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestedUrl.pathname).toBe("/wp-json/portfolio-studio/v1/photos");
    expect(requestedUrl.searchParams.get("page")).toBe("1");
    expect(requestedUrl.searchParams.get("per_page")).toBe("100");
  });

  it("shows an unavailable state when the WordPress photo API fails", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(new Response("offline", { status: 503 })),
    );

    const markup = renderToStaticMarkup(
      await PortfolioPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("Portfolio photos are temporarily unavailable.");
    expect(markup).not.toContain("No portfolio photos have been published yet.");
  });
});