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
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              slug: "about",
              title: { rendered: "About Tony" },
              content: {
                rendered:
                  '<p>Model based in Madrid.</p><img src="x" onerror="alert(1)">',
              },
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const markup = renderToStaticMarkup(await AboutPage());

    expect(markup).toContain('aria-label="About Tony"');
    expect(markup).toContain("Model based in Madrid.");
    expect(markup).toContain("Have a project in mind?");
    expect(markup).toContain('href="/contact"');
    expect(markup).toContain("Contact for booking");
    expect(markup).not.toContain("onerror");
    expect(markup).not.toContain("Coming soon.");
  });

  it("falls back to the localized title when WordPress has no About page", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response("[]", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const markup = renderToStaticMarkup(await AboutPage());

    expect(markup).toContain('aria-label="About"');
    expect(markup).toContain("This page is currently unavailable.");
    expect(markup).toContain("Have a project in mind?");
    expect(markup).not.toContain("Coming soon.");
  });
});
