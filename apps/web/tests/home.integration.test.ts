import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Home page integration", () => {
  it("renders every public value returned by the WordPress settings API", async () => {
    const cmsSettings = {
      name: "Example Site",
      description: "Example profile description",
      contactEmail: "contact@example.test",
      socialLinks: [
        { label: "Social link one", href: "https://social.example.test/one" },
        { label: "Social link two", href: "https://social.example.test/two" },
      ],
    };

    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify(cmsSettings), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("<h1");
    expect(markup).toContain(cmsSettings.name);
    expect(markup).toContain(cmsSettings.description);
    expect(markup).toContain("Coming soon.");
    expect(markup).toContain(cmsSettings.contactEmail);
    for (const link of cmsSettings.socialLinks) {
      expect(markup).toContain(link.label);
      expect(markup).toContain(link.href);
    }
    expect(markup.match(/rel="noopener noreferrer"/g)).toHaveLength(
      cmsSettings.socialLinks.length,
    );
    expect(markup).toContain("Social media");
    expect(markup).not.toContain("Elsewhere");
    expect(markup).not.toContain("Development theme preview");
  });
});
