import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import ThemePreviewPage from "@/app/dev/theme-preview/page";

const { notFound } = vi.hoisted(() => ({ notFound: vi.fn() }));

vi.mock("next/navigation", () => ({ notFound }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("development theme preview route", () => {
  it("renders the theme specimen in development", () => {
    vi.stubEnv("NODE_ENV", "development");

    const markup = renderToStaticMarkup(ThemePreviewPage());

    expect(markup).toContain("Development theme preview");
    expect(notFound).not.toHaveBeenCalled();
  });

  it.each(["test", "production"]) (
    "returns not found in %s",
    (environment) => {
      vi.stubEnv("NODE_ENV", environment);
      notFound.mockImplementation(() => {
        throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
      });

      expect(() => ThemePreviewPage()).toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
      expect(notFound).toHaveBeenCalledOnce();
    },
  );
});