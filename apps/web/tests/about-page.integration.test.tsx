import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import AboutPage from "@/app/about/page";
import { CmsPage } from "@/components/cms-page";
import { sanitizePageHtml } from "@/lib/wordpress-page";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("CmsPage", () => {
  it("renders the sanitized content without adding its own headline", () => {
    const markup = renderToStaticMarkup(
      <CmsPage html="<p>Body copy</p><h2>Section</h2>" title="About me" />,
    );

    expect(markup).not.toContain("<h1");
    expect(markup).toContain("<p>Body copy</p>");
    expect(markup).toContain("<h2>Section</h2>");
    expect(markup).toContain('aria-label="About me"');
  });

  it("shows an unavailable message when there is no content", () => {
    const markup = renderToStaticMarkup(<CmsPage title="About" />);

    expect(markup).toContain('aria-label="About"');
    expect(markup).toContain("This page is currently unavailable.");
  });

  it("does not show the unavailable message for a published page with an empty body", () => {
    const markup = renderToStaticMarkup(<CmsPage html="" title="About" />);

    expect(markup).not.toContain("currently unavailable");
  });

  it("keeps WordPress button links un-underlined at rest and on hover", () => {
    const html = sanitizePageHtml(
      '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://example.test/cv.pdf">Download CV</a></div>',
    );
    const markup = renderToStaticMarkup(<CmsPage html={html} title="About" />);
    const contentClass = markup.match(/<div class="([^"]+)"/)?.[1];

    expect(contentClass).toContain("cms-page-content");
    expect(html).toContain('class="wp-block-button__link wp-element-button"');
  });
});

describe("About page integration", () => {
  it("renders the WordPress page instead of the coming-soon screen", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation(async (input) => {
        const url = new URL(String(input));
        const body = url.pathname.endsWith("/portfolio-studio/v1/settings")
          ? { name: "Portfolio Studio" }
          : [
              {
                slug: "about",
                title: { rendered: "About Alex Morgan" },
                content: {
                  rendered:
                    '<p>Photographer based in Madrid.</p><img src="x" onerror="alert(1)">',
                },
              },
            ];
        return Response.json(body);
      }),
    );

    const markup = renderToStaticMarkup(await AboutPage());

    expect(markup).toContain('aria-label="About Alex Morgan"');
    expect(markup).toContain("Photographer based in Madrid.");
    expect(markup).toContain("Have a project in mind?");
    expect(markup).toContain('href="/contact"');
    expect(markup).toContain("Contact for booking");
    expect(markup).not.toContain("onerror");
    expect(markup).not.toContain("Coming soon.");
  });

  it("renders ProfilePage JSON-LD connected to the configured Person", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portfolio.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation(async (input) => {
        const url = new URL(String(input));
        const body = url.pathname.endsWith("/portfolio-studio/v1/settings")
          ? {
              name: "Portfolio Studio",
              description: "A creative portfolio.",
              seo: {
                home: {},
                defaultImage: null,
                person: {
                  name: "Alex Morgan",
                  description: "Approved bio.",
                  occupation: "Photographer",
                  image: null,
                  sameAs: ["https://instagram.com/example"],
                },
              },
            }
          : [
              {
                slug: "about",
                title: { rendered: "About Alex Morgan" },
                content: { rendered: "<p>About copy.</p>" },
                seo: {},
              },
            ];
        return Response.json(body);
      }),
    );

    const markup = renderToStaticMarkup(await AboutPage());
    const scripts = Array.from(
      markup.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
      (match) => JSON.parse(match[1]),
    );
    const profile = scripts.find((data) => data["@type"] === "ProfilePage");

    expect(profile).toMatchObject({
      url: "https://portfolio.example.test/about",
      mainEntity: { "@id": "https://portfolio.example.test/#person" },
    });
  });

  it("falls back to the localized title when WordPress has no About page", async () => {
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

    const markup = renderToStaticMarkup(await AboutPage());

    expect(markup).toContain('aria-label="About"');
    expect(markup).toContain("This page is currently unavailable.");
    expect(markup).toContain("Have a project in mind?");
    expect(markup).not.toContain("Coming soon.");
  });
});
