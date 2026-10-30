import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMetadata as aboutMetadata } from "@/app/about/page";
import { generateMetadata as contactMetadata } from "@/app/contact/page";
import { metadata as cvMetadata } from "@/app/cv/page";
import { metadata as homeMetadata } from "@/app/page";
import { generateMetadata as portfolioMetadata } from "@/app/portfolio/page";
import { generateMetadata as videosMetadata } from "@/app/videos/page";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("page canonical metadata", () => {
  it("sets a self-canonical for every public page", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation(
        async () =>
          new Response("[]", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    const metadata = [
      homeMetadata,
      await aboutMetadata(),
      await portfolioMetadata(),
      await videosMetadata(),
      await contactMetadata(),
      await cvMetadata,
    ];

    expect(metadata.map((item) => item.alternates?.canonical)).toEqual([
      "/",
      "/about",
      "/portfolio",
      "/videos",
      "/contact",
      "/cv",
    ]);
  });
});
