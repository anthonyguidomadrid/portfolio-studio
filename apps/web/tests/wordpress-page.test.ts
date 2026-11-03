import { afterEach, describe, expect, it, vi } from "vitest";
import { getPage, sanitizePageHtml } from "@/lib/wordpress-page";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const aboutPage = {
  slug: "about",
  title: { rendered: "About me" },
  content: { rendered: "<p>Hello <strong>world</strong></p>" },
};

describe("sanitizePageHtml", () => {
  it("keeps basic editorial markup", () => {
    const html = sanitizePageHtml(
      '<h2>Title</h2><p>Text <em>a</em> <a href="https://example.test/x">link</a></p><ul><li>One</li></ul>',
    );

    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain('<a href="https://example.test/x">link</a>');
    expect(html).toContain("<ul><li>One</li></ul>");
  });

  it("preserves only the eyebrow class on WordPress paragraphs", () => {
    const html = sanitizePageHtml(
      '<p class="eyebrow custom-class">Selected work</p>',
    );

    expect(html).toBe('<p class="eyebrow">Selected work</p>');
  });

  it("preserves secure YouTube embeds", () => {
    const html = sanitizePageHtml(
      '<figure><div><iframe title="Anuncio Colchones" width="560" height="315" src="https://www.youtube.com/embed/jurj-vtFA6k" allowfullscreen></iframe></div></figure>',
    );

    expect(html).toContain('title="Anuncio Colchones"');
    expect(html).toContain('src="https://www.youtube.com/embed/jurj-vtFA6k"');
    expect(html).toContain("allowfullscreen");
    expect(html).toContain('loading="lazy"');
  });

  it.each([
    ["script tags", "<p>a</p><script>alert(1)</script>", "<script"],
    [
      "inline handlers",
      '<img src="https://e.test/a.jpg" onerror="alert(1)">',
      "onerror",
    ],
    ["javascript links", '<a href="javascript:alert(1)">x</a>', "javascript:"],
    ["data links", '<a href="data:text/html;base64,AAAA">x</a>', "data:"],
    ["styles", '<p style="position:fixed">x</p>', "style="],
    ["forms", '<form action="https://evil.example"><input></form>', "<form"],
    [
      "protocol-relative images",
      '<img src="//evil.example/a.png">',
      "evil.example",
    ],
  ])("removes %s", (_label, input, forbidden) => {
    expect(sanitizePageHtml(input).toLowerCase()).not.toContain(forbidden);
  });

  it("removes iframe sources from untrusted hosts", () => {
    const html = sanitizePageHtml(
      '<iframe src="https://evil.example/embed"></iframe>',
    );

    expect(html).not.toContain('src="https://evil.example/embed"');
  });

  it("preserves h1 headings from WordPress content", () => {
    const html = sanitizePageHtml("<h1>Inner</h1>");

    expect(html).toBe("<h1>Inner</h1>");
  });

  it("hardens links that open a new tab and strips stray rel and target", () => {
    const blank = sanitizePageHtml(
      '<a href="https://e.test" target="_blank" rel="opener">x</a>',
    );
    const plain = sanitizePageHtml(
      '<a href="https://e.test" target="_self" rel="nofollow">x</a>',
    );

    expect(blank).toContain('rel="noopener noreferrer"');
    expect(blank).toContain('target="_blank"');
    expect(plain).not.toContain("target=");
    expect(plain).not.toContain("rel=");
  });

  it("preserves WordPress button block classes while keeping the PDF as a safe link", () => {
    const html = sanitizePageHtml(
      '<div class="wp-block-button is-style-outline is-style-outline--2"><a class="wp-block-button__link wp-element-button" href="https://cms.example.test/cv.pdf" target="_blank" rel="noopener">DOWNLOAD CV ↓</a></div>',
    );

    expect(html).toContain(
      '<div class="wp-block-button is-style-outline is-style-outline--2">',
    );
    expect(html).toContain(
      '<a class="wp-block-button__link wp-element-button" href="https://cms.example.test/cv.pdf" target="_blank" rel="noopener noreferrer">DOWNLOAD CV ↓</a>',
    );
  });

  it("lazy-loads images", () => {
    const html = sanitizePageHtml('<img src="https://e.test/a.jpg" alt="Me">');

    expect(html).toContain('loading="lazy"');
    expect(html).toContain('alt="Me"');
  });

  it("keeps the WordPress Columns block structure and its layout classes", () => {
    const html = sanitizePageHtml(
      '<div class="wp-block-columns is-layout-flex wp-container-core-columns-is-layout-794e3cfa are-vertically-aligned-center">' +
        '<div class="wp-block-column is-layout-flow" style="flex-basis:66.66%"><p>Left</p></div>' +
        '<div class="wp-block-column is-vertically-aligned-center"><p>Right</p></div>' +
        "</div>",
    );

    expect(html).toContain(
      '<div class="wp-block-columns are-vertically-aligned-center">',
    );
    expect(html).toContain(
      '<div class="wp-block-column" style="flex-basis:66.66%"><p>Left</p></div>',
    );
    expect(html).toContain(
      '<div class="wp-block-column is-vertically-aligned-center"><p>Right</p></div>',
    );
    expect(html).not.toContain("wp-container-core");
    expect(html).not.toContain("is-layout");
  });

  it("preserves WordPress spacer blocks with pixel heights", () => {
    const html = sanitizePageHtml(
      '<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>',
    );

    expect(html).toContain('style="height:100px"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="wp-block-spacer"');
  });

  it.each([
    ["arbitrary classes", '<div class="fixed inset-0 z-50">x</div>', "fixed"],
    [
      "other inline styles",
      '<div style="position:fixed;top:0">x</div>',
      "position",
    ],
    [
      "non-percentage flex-basis",
      '<div style="flex-basis:url(//evil.example)">x</div>',
      "evil.example",
    ],
    ["unsafe spacer height", '<div style="height:url(evil)"></div>', "url"],
    [
      "div handlers",
      '<div onclick="alert(1)" class="wp-block-column">x</div>',
      "onclick",
    ],
  ])("does not let div carry %s", (_label, input, forbidden) => {
    expect(sanitizePageHtml(input)).not.toContain(forbidden);
  });
});

describe("getPage", () => {
  it.each(["about", "contact"] as const)(
    "preserves image alt text through normalization for %s",
    async (slug) => {
      vi.stubEnv("CMS_URL", "https://cms.example.test");
      vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>().mockResolvedValue(
          json([
            {
              slug,
              title: { rendered: slug },
              content: {
                rendered:
                  '<figure><img class="wp-image-22" src="https://cms.example.test/wp-content/uploads/portrait.jpg" alt="Portrait with soft light &amp; a grey background"></figure>',
              },
            },
          ]),
        ),
      );

      const page = await getPage(slug);

      expect(page?.html).toContain(
        'alt="Portrait with soft light &amp; a grey background"',
      );
      expect(page?.html).toContain('loading="lazy"');
    },
  );

  it("returns undefined without calling the CMS when CMS_URL is not set", async () => {
    vi.stubEnv("CMS_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPage("about")).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches the page by slug with a cache tag and sanitizes its content", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test/");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      json([
        {
          ...aboutPage,
          content: {
            rendered: "<p>Hi</p><script>alert(1)</script>",
          },
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const page = await getPage("about");

    expect(page).toEqual({
      title: "About me",
      html: "<p>Hi</p>",
      socialUrls: {},
      seo: { title: "", description: "", image: null },
    });
    const [url, init] = fetchMock.mock.calls[0];
    const requested = new URL(String(url));
    expect(requested.origin + requested.pathname).toBe(
      "https://cms.example.test/wp-json/wp/v2/pages",
    );
    expect(requested.searchParams.get("slug")).toBe("about");
    expect(requested.searchParams.get("_fields")).toBe(
      "slug,title,content,seo",
    );
    expect(init).toEqual(
      expect.objectContaining({
        next: { revalidate: false, tags: ["wp-page-about"] },
      }),
    );
  });

  it("validates and normalizes page SEO overrides and sharing images", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        json([
          {
            ...aboutPage,
            seo: {
              title: "  About SEO  ",
              description: "  Search description  ",
              image: {
                id: 7,
                url: "https://cms.example.test/wp-content/uploads/share.jpg",
                width: 1200,
                height: 630,
                alt: "  Share image alt  ",
              },
            },
          },
        ]),
      ),
    );

    await expect(getPage("about")).resolves.toMatchObject({
      seo: {
        title: "About SEO",
        description: "Search description",
        image: {
          id: 7,
          width: 1200,
          height: 630,
          alt: "Share image alt",
        },
      },
    });
  });

  it("ignores page SEO images outside CMS uploads and malformed SEO values", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        json([
          {
            ...aboutPage,
            seo: {
              title: 5,
              description: "d".repeat(600),
              image: {
                id: 7,
                url: "https://external.example.test/wp-content/uploads/share.jpg",
                width: 1200,
                height: 630,
                alt: "Unsafe image",
              },
            },
          },
        ]),
      ),
    );

    await expect(getPage("about")).resolves.toMatchObject({
      seo: {
        title: "",
        description: "d".repeat(500),
        image: null,
      },
    });
  });

  it("decodes entities in the title to plain text", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          json([
            { ...aboutPage, title: { rendered: "Tom &amp; <b>Jerry</b>" } },
          ]),
        ),
    );

    await expect(getPage("about")).resolves.toMatchObject({
      title: "Tom & Jerry",
    });
  });

  it.each([
    ["no matching page", []],
    ["a different slug", [{ ...aboutPage, slug: "contact" }]],
    ["a non-array body", { code: "rest_no_route" }],
    ["a missing title", [{ slug: "about", content: { rendered: "<p>x</p>" } }]],
    ["a blank title", [{ ...aboutPage, title: { rendered: "  " } }]],
    ["missing content", [{ slug: "about", title: { rendered: "About" } }]],
  ])("returns undefined for %s", async (_label, body) => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(json(body)));

    await expect(getPage("about")).resolves.toBeUndefined();
  });

  it("returns undefined when the CMS errors or is unreachable", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(json({}, 500)),
    );
    await expect(getPage("about")).resolves.toBeUndefined();

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")),
    );
    await expect(getPage("about")).resolves.toBeUndefined();
  });
});
