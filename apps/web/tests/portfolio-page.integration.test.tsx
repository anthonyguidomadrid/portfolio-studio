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
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async (input) => {
        const url = new URL(String(input));
        const body = url.pathname.endsWith("/portfolio-studio/v1/settings")
          ? { name: "Portfolio Studio" }
          : url.pathname.endsWith("/wp/v2/pages")
            ? [
                {
                  slug: "portfolio",
                  title: { rendered: "My selected work" },
                  content: {
                    rendered:
                      '<p class="eyebrow">Fashion &amp; campaign work</p><p>Explore the portfolio.</p>',
                  },
                },
              ]
            : {
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
                      alt: "Photographer in the studio",
                      caption: "Studio session",
                    },
                    tags: [{ id: 1, slug: "editorial", name: "Editorial" }],
                  },
                ],
                tags: [{ id: 1, slug: "editorial", name: "Editorial" }],
                total: 1,
                totalPages: 1,
                page: 1,
              };
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });
    vi.stubGlobal("fetch", fetchMock);

    const markup = renderToStaticMarkup(
      await PortfolioPage({
        searchParams: Promise.resolve({ tag: "editorial" }),
      }),
    );

    expect(markup).toContain("Fashion &amp; campaign work");
    expect(markup).toContain("Explore the portfolio.");
    expect(markup).toContain("Studio Portrait");
    expect(markup).toContain("Editorial");
    expect(markup).toContain("Photographer in the studio");
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).not.toContain(">Portfolio</h1>");
    expect(markup).not.toContain("Coming soon.");
    expect(markup).toContain("mt-section mb-section");
    expect(markup.indexOf("Explore the portfolio.")).toBeLessThan(
      markup.indexOf("Filter portfolio photos"),
    );
    const photoCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes("/portfolio-studio/v1/photos"),
    );
    const requestedUrl = new URL(String(photoCall?.[0]));
    expect(requestedUrl.pathname).toBe("/wp-json/portfolio-studio/v1/photos");
    expect(requestedUrl.searchParams.get("page")).toBe("1");
    expect(requestedUrl.searchParams.get("per_page")).toBe("100");
    const pageCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes("/wp/v2/pages"),
    );
    expect(new URL(String(pageCall?.[0])).searchParams.get("slug")).toBe(
      "portfolio",
    );
  });

  it("shows an unavailable state when the WordPress photo API fails", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation(async (input) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith("/portfolio-studio/v1/settings")) {
          return Response.json({ name: "Portfolio Studio" });
        }
        const isPage = url.pathname.endsWith("/wp/v2/pages");
        return new Response(isPage ? "[]" : "offline", {
          status: isPage ? 200 : 503,
        });
      }),
    );

    const markup = renderToStaticMarkup(
      await PortfolioPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("Portfolio photos are temporarily unavailable.");
    expect(markup).not.toContain(
      "No portfolio photos have been published yet.",
    );
  });
});
