import { afterEach, describe, expect, it, vi } from "vitest";
import { getPortfolioCollection } from "@/lib/portfolio-photos";

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

function photo(id: number, displayOrder = id) {
  return {
    id,
    slug: `photo-${id}`,
    title: `Photo ${id}`,
    displayOrder,
    image: {
      id: id + 100,
      url: `https://cms.example.test/wp-content/uploads/photo-${id}.jpg`,
      width: 800,
      height: 1200,
      alt: `Portrait ${id}`,
      caption: "",
    },
    tags: [{ id: 1, slug: "editorial", name: "Editorial" }],
  };
}

describe("getPortfolioCollection", () => {
  it("distinguishes unavailable CMS configuration from an empty collection", async () => {
    vi.stubEnv("CMS_URL", "");
    await expect(getPortfolioCollection()).resolves.toEqual({
      status: "unavailable",
      items: [],
      tags: [],
    });

    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        json({ items: [], tags: [], total: 0, totalPages: 0, page: 1 }),
      ),
    );
    await expect(getPortfolioCollection()).resolves.toEqual({
      status: "available",
      items: [],
      tags: [],
    });
  });

  it("fetches every page in API order and caches it with the gallery tag", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test/");
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        json({
          items: [photo(1, 1)],
          tags: [{ id: 1, slug: "editorial", name: "Editorial" }],
          total: 2,
          totalPages: 2,
          page: 1,
        }),
      )
      .mockResolvedValueOnce(
        json({
          items: [photo(2, 2)],
          tags: [{ id: 1, slug: "editorial", name: "Editorial" }],
          total: 2,
          totalPages: 2,
          page: 2,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getPortfolioCollection();

    expect(result.status).toBe("available");
    expect(result.items.map(({ id }) => id)).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstUrl = new URL(String(fetchMock.mock.calls[0][0]));
    const secondUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(firstUrl.searchParams.get("per_page")).toBe("100");
    expect(firstUrl.searchParams.get("page")).toBe("1");
    expect(secondUrl.searchParams.get("page")).toBe("2");
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        next: { revalidate: 3600, tags: ["wp-portfolio-photos"] },
      }),
    );
  });

  it("rejects external image hosts and invalid collection responses", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        json({
          items: [
            {
              ...photo(1),
              image: {
                ...photo(1).image,
                url: "https://attacker.example/photo.jpg",
              },
            },
          ],
          tags: [],
          total: 1,
          totalPages: 1,
          page: 1,
        }),
      ),
    );

    await expect(getPortfolioCollection()).resolves.toMatchObject({
      status: "unavailable",
      items: [],
    });
  });

  it("rejects image URLs containing credentials even on the CMS host", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        json({
          items: [
            {
              ...photo(1),
              image: {
                ...photo(1).image,
                url: "https://user:secret@cms.example.test/wp-content/uploads/photo-1.jpg",
              },
            },
          ],
          tags: [],
          total: 1,
          totalPages: 1,
          page: 1,
        }),
      ),
    );

    await expect(getPortfolioCollection()).resolves.toMatchObject({
      status: "unavailable",
    });
  });

  it("returns unavailable when WordPress errors", async () => {
    vi.stubEnv("CMS_URL", "https://cms.example.test");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(json({ message: "Offline" }, 503)),
    );

    await expect(getPortfolioCollection()).resolves.toMatchObject({
      status: "unavailable",
    });
  });
});