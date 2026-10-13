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

  it.each([
    ["script tags", "<p>a</p><script>alert(1)</script>", "<script"],
    [
      "inline handlers",
      '<img src="https://e.test/a.jpg" onerror="alert(1)">',
      "onerror",
    ],
    ["javascript links", '<a href="javascript:alert(1)">x</a>', "javascript:"],
    ["data links", '<a href="data:text/html;base64,AAAA">x</a>', "data:"],
    ["iframes", '<iframe src="https://evil.example"></iframe>', "<iframe"],
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

  it("downgrades h1 so the page title stays the only h1", () => {
    const html = sanitizePageHtml("<h1>Inner</h1>");

    expect(html).toBe("<h2>Inner</h2>");
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

    expect(page).toEqual({ title: "About me", html: "<p>Hi</p>" });
    const [url, init] = fetchMock.mock.calls[0];
    const requested = new URL(String(url));
    expect(requested.origin + requested.pathname).toBe(
      "https://cms.example.test/wp-json/wp/v2/pages",
    );
    expect(requested.searchParams.get("slug")).toBe("about");
    expect(init).toEqual(
      expect.objectContaining({
        next: { revalidate: 3600, tags: ["wp-page-about"] },
      }),
    );
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
