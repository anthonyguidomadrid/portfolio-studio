import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as favicon } from "@/app/favicon.ico/route";
import { GET as appleIcon } from "@/app/apple-touch-icon.png/route";
import { GET as asset } from "@/app/favicons/[asset]/route";
import manifest from "@/app/manifest";
import { getSiteInitials } from "@/lib/site-icons";
import { getSiteConfig } from "@/lib/site-config";

vi.mock("@/lib/site-config", () => ({ getSiteConfig: vi.fn() }));

afterEach(() => {
  vi.resetAllMocks();
});

function configureSite(name = "Portfolio Studio") {
  vi.mocked(getSiteConfig).mockResolvedValue({
    name,
    description: "A creative portfolio",
  } as Awaited<ReturnType<typeof getSiteConfig>>);
}

function getAsset(name: string) {
  return asset(new Request(`https://example.test/favicons/${name}`), {
    params: Promise.resolve({ asset: name }),
  });
}

async function expectPng(response: Response, size: number) {
  expect(response.headers.get("content-type")).toBe("image/png");
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect(Array.from(bytes.slice(0, 8))).toEqual([
    137, 80, 78, 71, 13, 10, 26, 10,
  ]);
  const header = new DataView(bytes.buffer);
  expect(header.getUint32(16)).toBe(size);
  expect(header.getUint32(20)).toBe(size);
}

describe("site icons", () => {
  it("uses CMS initials and handles an empty preview name", async () => {
    configureSite("  Example   Creative Studio  ");
    expect(await getSiteInitials()).toBe("EC");
    configureSite(" ");
    expect(await getSiteInitials()).toBe("S");
  });

  it("serves a scalable SVG and escapes CMS text", async () => {
    configureSite("<Studio &Company");
    const response = await getAsset("favicon.svg");
    expect(response.headers.get("content-type")).toBe("image/svg+xml");
    const svg = await response.text();
    expect(svg).toContain('viewBox="0 0 32 32"');
    expect(svg).toContain('font-weight="400"');
    expect(svg).toContain(
      '<rect x="2" y="2" width="28" height="28" fill="#ffffff"/>',
    );
    expect(svg).toContain('fill="#111111"');
    expect(svg).not.toContain("stroke=");
    expect(svg).toContain("&#60;&#38;</text>");
  });

  it.each([96, 192, 512])("serves a %i pixel PNG", async (size) => {
    configureSite();
    const name =
      size === 96
        ? "favicon-96x96.png"
        : `web-app-manifest-${size}x${size}.png`;
    await expectPng(await getAsset(name), size);
  });

  it("serves a 180 pixel Apple touch icon", async () => {
    configureSite();
    await expectPng(await appleIcon(), 180);
  });

  it("serves an ICO directory with embedded 16, 32, and 48 pixel PNGs", async () => {
    configureSite();
    const response = await favicon();
    expect(response.headers.get("content-type")).toBe("image/x-icon");
    const bytes = new Uint8Array(await response.arrayBuffer());
    const header = new DataView(bytes.buffer);
    expect(header.getUint16(0, true)).toBe(0);
    expect(header.getUint16(2, true)).toBe(1);
    expect(header.getUint16(4, true)).toBe(3);
    let expectedImageOffset = 6 + 3 * 16;
    for (const [index, size] of [16, 32, 48].entries()) {
      const entryOffset = 6 + index * 16;
      expect([bytes[entryOffset], bytes[entryOffset + 1]]).toEqual([
        size,
        size,
      ]);
      expect(header.getUint16(entryOffset + 4, true)).toBe(1);
      expect(header.getUint16(entryOffset + 6, true)).toBe(32);
      const imageLength = header.getUint32(entryOffset + 8, true);
      const imageOffset = header.getUint32(entryOffset + 12, true);
      expect(imageLength).toBeGreaterThan(0);
      expect(imageOffset).toBe(expectedImageOffset);
      await expectPng(
        new Response(bytes.slice(imageOffset, imageOffset + imageLength), {
          headers: { "Content-Type": "image/png" },
        }),
        size,
      );
      expectedImageOffset += imageLength;
    }
    expect(expectedImageOffset).toBe(bytes.length);
  });

  it.each(["unknown.png", "toString", "__proto__"])(
    "rejects unknown asset %s",
    async (name) => {
      expect((await getAsset(name)).status).toBe(404);
      expect(getSiteConfig).not.toHaveBeenCalled();
    },
  );

  it("provides a CMS-driven manifest with both install icon sizes", async () => {
    configureSite("Example Studio");
    expect(await manifest()).toMatchObject({
      name: "Example Studio",
      short_name: "Example Studio",
      description: "A creative portfolio",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#ffffff",
      icons: [
        {
          src: "/favicons/web-app-manifest-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/favicons/web-app-manifest-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
      ],
    });
  });
});
