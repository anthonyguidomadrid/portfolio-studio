import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMetadata as rootMetadata } from "@/app/layout";
import { generateMetadata as aboutMetadata } from "@/app/about/page";
import { generateMetadata as contactMetadata } from "@/app/contact/page";
import { generateMetadata as legalMetadata } from "@/app/legal/page";
import { generateMetadata as homeMetadata } from "@/app/page";
import { generateMetadata as portfolioMetadata } from "@/app/portfolio/page";
import { generateMetadata as videosMetadata } from "@/app/videos/page";

vi.mock("next/font/google", () => ({
  Montserrat: () => ({ variable: "--font-montserrat" }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("page canonical metadata", () => {
  it("sets a self-canonical for every public page", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation(async (input) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith("/portfolio-studio/v1/settings")) {
          return Response.json({
            name: "Example Studio",
            description: "A portfolio.",
            seo: { home: {}, defaultImage: null },
          });
        }
        const slug = url.searchParams.get("slug");
        return Response.json([
          {
            slug,
            title: { rendered: slug ?? "Page" },
            content: { rendered: "<p>Page content</p>" },
            seo: { title: "", description: "", image: null },
          },
        ]);
      }),
    );

    const metadata = [
      await homeMetadata(),
      await aboutMetadata(),
      await portfolioMetadata(),
      await videosMetadata(),
      await contactMetadata(),
      await legalMetadata(),
    ];

    expect(metadata.map((item) => item.alternates?.canonical)).toEqual([
      "/",
      "/about",
      "/portfolio",
      "/videos",
      "/contact",
      "/legal",
    ]);
  });

  it("declares all favicon formats, the touch title, and the manifest", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json({
          name: "Example Studio",
          description: "A portfolio",
          seo: { home: {}, defaultImage: null },
        }),
      ),
    );

    expect(await rootMetadata()).toMatchObject({
      applicationName: "Example Studio",
      appleWebApp: { title: "Example Studio", capable: true },
      manifest: "/manifest.webmanifest",
      icons: {
        icon: [
          { url: "/favicon.ico", type: "image/x-icon", sizes: "32x32" },
          {
            url: "/favicons/favicon-96x96.png",
            type: "image/png",
            sizes: "96x96",
          },
          { url: "/favicons/favicon.svg", type: "image/svg+xml", sizes: "any" },
        ],
        apple: [
          { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
        ],
      },
    });
  });
});
