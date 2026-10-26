// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ImgHTMLAttributes } from "react";
import { NotFoundView } from "@/components/not-found-view";
import { messages } from "@/messages/en";

vi.mock("next/image", () => ({
  default: ({
    fill,
    preload,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    preload?: boolean;
  }) => {
    void fill;
    void preload;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt="" />;
  },
}));

const { getSiteConfig } = vi.hoisted(() => ({ getSiteConfig: vi.fn() }));
vi.mock("@/lib/site-config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/site-config")>()),
  getSiteConfig,
}));

const image = {
  id: 201,
  url: "https://cms.example.test/wp-content/uploads/background.jpg",
  width: 1600,
  height: 1000,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("custom 404", () => {
  it("renders the route using the CMS image and a decorative background", async () => {
    getSiteConfig.mockResolvedValue({ notFoundBackgroundImage: image });
    const { default: NotFound } = await import("@/app/not-found");
    const { container } = render(await NotFound());
    expect(screen.getByRole("main").getAttribute("aria-labelledby")).toBe(
      "not-found-title",
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      messages.notFound.title,
    );
    expect(screen.queryByText(messages.notFound.code)).toBeNull();
    expect(screen.getByText(messages.notFound.subtitle)).toBeTruthy();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(image.url);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it.each([undefined, null])(
    "renders without a background for missing/null CMS images",
    async (value) => {
      getSiteConfig.mockResolvedValue({ notFoundBackgroundImage: value });
      const { default: NotFound } = await import("@/app/not-found");
      const { container } = render(await NotFound());
      expect(container.querySelector("img")).toBeNull();
      expect(screen.getByRole("main").className).toContain("bg-primary");
      expect(
        screen
          .getByRole("link", { name: messages.notFound.home })
          .getAttribute("href"),
      ).toBe("/");
    },
  );

  it("keeps the content and home action available if the image fails", () => {
    const { container } = render(<NotFoundView image={image} />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: messages.notFound.home }),
    ).toBeTruthy();
  });

  it("offers a keyboard and pointer accessible home link", async () => {
    const user = userEvent.setup();
    render(<NotFoundView image={null} />);
    const home = screen.getByRole("link", { name: messages.notFound.home });
    await user.tab();
    expect(document.activeElement).toBe(home);
    const click = vi.fn((event: MouseEvent) => event.preventDefault());
    home.addEventListener("click", click);
    await user.keyboard("{Enter}");
    await user.click(home);
    expect(click).toHaveBeenCalledTimes(2);
    expect(home.getAttribute("href")).toBe("/");
  });
});
