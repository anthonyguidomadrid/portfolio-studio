// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeHero } from "@/components/home-hero";
import { navigationItems, type SiteConfig } from "@/lib/site-config";

type Listener = () => void;

let reducedMotion = false;
let listeners: Listener[] = [];

beforeEach(() => {
  reducedMotion = false;
  listeners = [];
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("reduce") && reducedMotion,
      media: query,
      addEventListener: (_: string, listener: Listener) =>
        listeners.push(listener),
      removeEventListener: (_: string, listener: Listener) => {
        listeners = listeners.filter((item) => item !== listener);
      },
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const siteConfig: SiteConfig = {
  name: "Studio Example",
  description: "An independent creative portfolio.",
  contactEmail: "",
  homeVideoId: "dQw4w9WgXcQ",
  socialLinks: [],
  socialUrls: {
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
    pinterest: "",
    tumblr: "",
    flickr: "",
  },
  navigation: navigationItems,
};

describe("HomeHero", () => {
  it("keeps the eyebrow, site name and description over a dark overlay in white text", () => {
    const { container } = render(
      <HomeHero eyebrow="Portfolio" siteConfig={siteConfig} />,
    );

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Studio Example",
    );
    expect(screen.getByText("Portfolio")).toBeTruthy();
    expect(screen.getByText("An independent creative portfolio.")).toBeTruthy();
    expect(screen.queryByText("Coming soon.")).toBeNull();

    const content = screen.getByRole("region", { name: "Studio Example" });
    expect(content.className).toContain("text-primary-foreground");
    expect(content.className).toContain("text-shadow");
    expect(container.querySelector('div[aria-hidden="true"]')?.className).toContain(
      "bg-primary/60",
    );
  });

  it("plays a decorative muted background video that cannot receive focus", () => {
    const { container } = render(
      <HomeHero eyebrow="Portfolio" siteConfig={siteConfig} />,
    );

    const frame = container.querySelector("iframe");
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute("src")).toContain(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?",
    );
    expect(frame?.getAttribute("src")).toContain("mute=1");
    expect(frame?.getAttribute("aria-hidden")).toBe("true");
    expect(frame?.getAttribute("tabindex")).toBe("-1");
    expect(frame?.getAttribute("title")).toBe("Background video");
    expect(frame?.className).toContain("pointer-events-none");
  });

  it("does not load the video when reduced motion is preferred", () => {
    reducedMotion = true;
    const { container } = render(
      <HomeHero eyebrow="Portfolio" siteConfig={siteConfig} />,
    );

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
  });

  it("stops the video when the reduced motion preference turns on", () => {
    const { container } = render(
      <HomeHero eyebrow="Portfolio" siteConfig={siteConfig} />,
    );
    expect(container.querySelector("iframe")).not.toBeNull();

    reducedMotion = true;
    act(() => listeners.forEach((listener) => listener()));

    expect(container.querySelector("iframe")).toBeNull();
  });
});
