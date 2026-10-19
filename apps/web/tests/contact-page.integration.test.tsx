import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import ContactPage from "@/app/contact/page";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Contact page integration", () => {
  it("renders the published WordPress Contact page", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async (input) => {
        const isSettings = String(input).includes("/settings");
        const body = isSettings
          ? {
              name: "Portfolio",
            }
          : [
              {
                slug: "contact",
                title: { rendered: "Let's work together" },
                content: {
                  rendered:
                    '<p>Send a booking enquiry.</p><ul class="wp-block-social-links is-layout-flex wp-block-social-links-is-layout-flex"><li class="wp-social-link wp-social-link-instagram wp-block-social-link"><a href="https://www.instagram.com/tonymickofficial/" class="wp-block-social-link-anchor"><svg aria-hidden="true"><path d="example"></path></svg><span class="screen-reader-text">Instagram</span></a></li><li class="wp-social-link wp-social-link-youtube wp-block-social-link"><a href="https://www.youtube.com/@TonyMikeOfficial" class="wp-block-social-link-anchor"><svg aria-hidden="true"><path d="example"></path></svg><span class="screen-reader-text">YouTube</span></a></li></ul>',
                },
              },
            ];
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });
    vi.stubGlobal("fetch", fetchMock);

    const markup = renderToStaticMarkup(await ContactPage());

    expect(markup).toContain('aria-label="Let&#x27;s work together"');
    expect(markup).toContain("Send a booking enquiry.");
    expect(markup).not.toContain("wp-block-social-links");
    expect(markup).not.toContain(">Instagram</a>");
    expect(markup).not.toContain(">YouTube</a>");
    expect(markup).toContain(
      'href="https://www.instagram.com/tonymickofficial/"',
    );
    expect(markup).toContain(
      'href="https://www.youtube.com/@TonyMikeOfficial"',
    );
    expect(markup).toContain('aria-label="Social media"');
    expect(markup).toContain('aria-label="Instagram"');
    expect(markup).toContain('aria-label="YouTube"');
    expect(markup).toContain("contact-social-list");
    expect(markup).toContain("list-none flex-wrap");
    expect(markup).toContain("justify-start gap-3 p-0");
    expect(markup).toContain('height="28" width="28"');
    expect(markup.indexOf("Send a booking enquiry.")).toBeLessThan(
      markup.indexOf('aria-label="Instagram"'),
    );
    expect(markup.indexOf('aria-label="Instagram"')).toBeLessThan(
      markup.indexOf("</article>"),
    );
    expect(markup).not.toContain("Coming soon.");
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestedUrl.searchParams.get("slug")).toBe("contact");
  });

  it("shows the unavailable state when WordPress has no Contact page", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation(async (input) => {
        const body = String(input).includes("/settings")
          ? { name: "Portfolio" }
          : [];
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    const markup = renderToStaticMarkup(await ContactPage());

    expect(markup).toContain('aria-label="Contact"');
    expect(markup).toContain("This page is currently unavailable.");
    expect(markup).not.toContain("Coming soon.");
  });
});
