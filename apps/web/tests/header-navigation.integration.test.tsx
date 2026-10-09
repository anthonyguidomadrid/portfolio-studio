// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { HeaderNavigation } from "@/components/header-navigation";
import { navigationItems } from "@/lib/site-config";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

vi.mock("next/link", async () => {
  const React = await import("react");

  return {
    default: ({
      href,
      onClick,
      ...props
    }: React.ComponentProps<"a"> & { href: string }) =>
      React.createElement("a", {
        ...props,
        href,
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          onClick?.(event);
        },
      }),
  };
});

const testSite = {
  name: "Test Portfolio",
  navigation: navigationItems,
};

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/about");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("HeaderNavigation integration", () => {
  it("passes the configured brand into the home link", async () => {
    vi.stubEnv("CMS_URL", "");
    render(await Header());

    const homeLink = screen.getByRole("link", { name: "Go to home page" });
    expect(homeLink.getAttribute("href")).toBe("/");
    expect(homeLink.textContent).toBe("STUDIO PORTFOLIO");
  });

  it("exposes an icon-only menu control and starts with the panel inaccessible", () => {
    render(<HeaderNavigation {...testSite} />);

    const button = screen.getByRole("button", {
      name: "Open navigation menu",
    });
    const mobileNavigation = document.getElementById("mobile-navigation");

    expect(button.textContent).toBe("");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.className).toContain("size-11");
    expect(mobileNavigation?.getAttribute("aria-hidden")).toBe("true");
    expect(mobileNavigation?.hasAttribute("inert")).toBe(true);
  });

  it("opens the panel, updates accessible state, and closes on Escape with focus restored", async () => {
    const user = userEvent.setup();
    render(<HeaderNavigation {...testSite} />);

    const button = screen.getByRole("button", {
      name: "Open navigation menu",
    });
    await user.click(button);

    const mobileNavigation = document.getElementById("mobile-navigation");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Close navigation menu");
    expect(mobileNavigation?.getAttribute("aria-hidden")).toBe("false");
    expect(mobileNavigation?.hasAttribute("inert")).toBe(false);
    expect(mobileNavigation?.className).toContain("grid-rows-[1fr]");

    await user.keyboard("{Escape}");

    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-label")).toBe("Open navigation menu");
    expect(mobileNavigation?.hasAttribute("inert")).toBe(true);
    expect(document.activeElement).toBe(button);
  });

  it("closes the panel when a navigation link is selected", async () => {
    const user = userEvent.setup();
    render(<HeaderNavigation {...testSite} />);

    await user.click(
      screen.getByRole("button", { name: "Open navigation menu" }),
    );
    const mobileNavigation = document.getElementById("mobile-navigation");
    await user.click(
      within(mobileNavigation as HTMLElement).getByRole("link", {
        name: "Contact",
      }),
    );

    expect(
      screen
        .getByRole("button", { name: "Open navigation menu" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    expect(mobileNavigation?.hasAttribute("inert")).toBe(true);
  });

  it("marks only matching destinations current in each navigation", () => {
    vi.mocked(usePathname).mockReturnValue("/portfolio/sample-project");
    render(<HeaderNavigation {...testSite} />);

    const currentLinks = Array.from(
      document.querySelectorAll('a[aria-current="page"]'),
    );
    expect(currentLinks).toHaveLength(2);
    expect(currentLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/portfolio",
      "/portfolio",
    ]);
  });
});
