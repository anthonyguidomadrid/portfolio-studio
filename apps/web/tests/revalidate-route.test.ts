import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath, revalidateTag }));

import { POST } from "@/app/api/revalidate/route";

function request(body: unknown, secret: string | null = "test-secret") {
  return new Request("https://site.example.test/api/revalidate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("REVALIDATION_SECRET", "test-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/revalidate", () => {
  it("rejects requests without the shared secret", async () => {
    const missing = await POST(request({ type: "page", slug: "about" }, null));
    const wrong = await POST(
      request({ type: "page", slug: "about" }, "wrong-secret"),
    );

    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("refreshes the cached WordPress page and its route for a page event", async () => {
    const response = await POST(request({ type: "page", slug: "about" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      revalidated: true,
      paths: ["/about"],
    });
    expect(revalidateTag).toHaveBeenCalledWith("wp-page-about", "max");
    expect(revalidatePath).toHaveBeenCalledWith("/about");
  });

  it.each([
    ["an unknown slug", { type: "page", slug: "admin" }],
    ["a path-like slug", { type: "page", slug: "../secret" }],
    ["a missing slug", { type: "page" }],
    ["an unknown type", { type: "nope" }],
  ])("rejects %s", async (_label, body) => {
    const response = await POST(request(body));

    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("still refreshes site settings and Home", async () => {
    const response = await POST(request({ type: "site_settings" }));

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("site-settings", "max");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("refreshes the cached portfolio collection only for the collection event", async () => {
    const response = await POST(request({ type: "portfolio_item", slug: "" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      revalidated: true,
      paths: ["/portfolio"],
    });
    expect(revalidateTag).toHaveBeenCalledWith("wp-portfolio-photos", "max");
    expect(revalidatePath).toHaveBeenCalledWith("/portfolio");
  });

  it("rejects portfolio events with item slugs instead of the collection marker", async () => {
    const response = await POST(
      request({ type: "portfolio_item", slug: "sample-photo" }),
    );

    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
