import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import LegalPage, { generateMetadata } from "@/app/legal/page";
import { cmsPageCacheTag, isCmsPageSlug } from "@/lib/cms-pages";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockPages(pages: unknown) {
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
    const url = new URL(String(input));
    const body = url.pathname.endsWith("/portfolio-studio/v1/settings")
      ? { name: "Studio", description: "A creative portfolio." }
      : pages;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubEnv("CMS_URL", "https://cms.example.test");
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Legal page integration", () => {
  it("renders sanitized WordPress content and metadata without a booking CTA", async () => {
    const fetchMock = mockPages([
      {
        slug: "legal",
        title: {
          rendered:
            '<strong>Privacy &amp; cookies</strong><script>alert("title")</script>',
        },
        content: {
          rendered:
            '<h1>Our privacy notice</h1><p>CMS legal copy.</p><script>alert("body")</script><img src="https://example.test/privacy.png" alt="Privacy" onerror="alert(1)"><a href="javascript:alert(1)">Unsafe link</a>',
        },
      },
    ]);

    const markup = renderToStaticMarkup(await LegalPage());

    expect(await generateMetadata()).toMatchObject({
      title: "Privacy & cookies",
      alternates: { canonical: "/legal" },
      description: "A creative portfolio.",
      openGraph: {
        title: "Privacy & cookies",
        url: new URL("http://localhost:3000/legal"),
      },
      twitter: { title: "Privacy & cookies" },
    });
    expect(markup).toContain('aria-label="Privacy &amp; cookies"');
    expect(markup).toContain("<h1>Our privacy notice</h1>");
    expect(markup).toContain("<p>CMS legal copy.</p>");
    expect(markup).not.toContain("<script>alert");
    expect(markup).toContain('<script type="application/ld+json">');
    expect(markup).not.toContain("onerror");
    expect(markup).not.toContain("javascript:");
    expect(markup).not.toContain("alert(");
    expect(markup).not.toContain("Have a project in mind?");
    expect(markup).not.toContain('href="/contact"');
    expect(markup).not.toContain("Cookie Settings");

    const [url, options] = fetchMock.mock.calls[0];
    const requestedUrl = new URL(String(url));
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(
      "https://cms.example.test/wp-json/wp/v2/pages",
    );
    expect(requestedUrl.searchParams.get("slug")).toBe("legal");
    expect(requestedUrl.searchParams.get("_fields")).toBe(
      "slug,title,content,seo",
    );
    expect(options).toMatchObject({
      next: { revalidate: false, tags: ["wp-page-legal"] },
    });
    expect(isCmsPageSlug("legal")).toBe(true);
    expect(cmsPageCacheTag("legal")).toBe("wp-page-legal");
  });

  it.each([
    ["missing", []],
    ["invalid", [{ slug: "legal", title: { rendered: "Legal" } }]],
  ])(
    "uses fallback content and metadata for a %s page",
    async (_state, pages) => {
      mockPages(pages);

      const markup = renderToStaticMarkup(await LegalPage());

      expect(await generateMetadata()).toMatchObject({
        title: "Privacy and cookies",
        alternates: { canonical: "/legal" },
        description: "A creative portfolio.",
        openGraph: { title: "Privacy and cookies" },
        twitter: { title: "Privacy and cookies" },
      });
      expect(markup).toContain('aria-label="Privacy and cookies"');
      expect(markup).toContain("This page is currently unavailable.");
      expect(markup).not.toContain("Have a project in mind?");
    },
  );

  it("uses fallback content and metadata when WordPress is unavailable", async () => {
    const fetchMock = mockPages([]);
    fetchMock.mockRejectedValue(new Error("CMS unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const markup = renderToStaticMarkup(await LegalPage());

    expect(await generateMetadata()).toMatchObject({
      title: "Privacy and cookies",
      alternates: { canonical: "/legal" },
      description: "A flexible home for selected work.",
      openGraph: { title: "Privacy and cookies" },
      twitter: { title: "Privacy and cookies" },
    });
    expect(markup).toContain('aria-label="Privacy and cookies"');
    expect(markup).toContain("This page is currently unavailable.");
  });

  it("uses the fallback without fetching when CMS_URL is absent", async () => {
    vi.stubEnv("CMS_URL", "");
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const markup = renderToStaticMarkup(await LegalPage());

    expect(await generateMetadata()).toMatchObject({
      title: "Privacy and cookies",
      alternates: { canonical: "/legal" },
      description: "A flexible home for selected work.",
      openGraph: { title: "Privacy and cookies" },
      twitter: { title: "Privacy and cookies" },
    });
    expect(markup).toContain("This page is currently unavailable.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
