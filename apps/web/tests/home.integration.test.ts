import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Home page integration", () => {
  it("renders the name returned by the public WordPress settings API", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            name: "WordPress Studio Name",
            description: "A portfolio description.",
            contactEmail: "hello@example.test",
            socialLinks: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("<h1");
    expect(markup).toContain("WordPress Studio Name");
    expect(markup).toContain("Coming soon.");
    expect(markup).not.toContain("Development theme preview");
  });
});
