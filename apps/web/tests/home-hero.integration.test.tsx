// @vitest-environment jsdom

import {
  act,
  cleanup,
  render as testingRender,
  screen,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { ConsentProvider } from "@/components/consent/provider";
import { CONSENT_STORAGE_KEY, createConsent } from "@/lib/consent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeHero } from "@/components/home-hero";
import { navigationItems, type SiteConfig } from "@/lib/site-config";

type Listener = () => void;

let reducedMotion = false;
let listeners: Listener[] = [];

function render(children: ReactNode) {
  return testingRender(<ConsentProvider>{children}</ConsentProvider>);
}

beforeEach(() => {
  localStorage.setItem(
    CONSENT_STORAGE_KEY,
    JSON.stringify(createConsent({ analytics: false, youtube: true })),
  );
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
  localStorage.clear();
  vi.unstubAllGlobals();
});

const siteConfig: SiteConfig = {
  name: "Studio Example",
  description: "An independent creative portfolio.",
  contactEmail: "",
  homeVideoId: "dQw4w9WgXcQ",
  homeVideoStart: 45,
  seo: {
    home: { title: "", description: "", image: null },
    defaultImage: null,
  },
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

    expect(screen.getByText("Portfolio").className).toContain("text-xl");
    expect(
      screen.getByText("An independent creative portfolio.").className,
    ).toContain("text-body");

    const content = screen.getByRole("region", { name: "Studio Example" });
    expect(content.className).toContain("text-primary-foreground");
    expect(content.className).toContain("text-shadow");
    expect(
      container.querySelector('div[aria-hidden="true"]')?.className,
    ).toContain("bg-primary/60");
    expect(
      container.querySelector('div[aria-hidden="true"].bg-gradient-to-b')
        ?.className,
    ).toContain("from-primary");
  });

  it("plays the muted background without saved consent or a consent prompt", () => {
    localStorage.clear();
    const { container } = render(
      <HomeHero eyebrow="Portfolio" siteConfig={siteConfig} />,
    );

    const frame = container.querySelector("iframe");
    expect(frame?.src).toContain(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?",
    );
    expect(frame?.src).toContain("autoplay=1");
    expect(frame?.src).toContain("mute=1");
    expect(frame?.src).toContain("start=45");
    expect(frame?.getAttribute("aria-hidden")).toBe("true");
    expect(frame?.getAttribute("tabindex")).toBe("-1");
    expect(
      screen.queryByRole("button", { name: "Allow YouTube and play" }),
    ).toBeNull();
    expect(container.querySelector("main")?.className).not.toContain(
      "flex-col",
    );
  });

  it("does not render an iframe when there is no valid video ID", () => {
    const { container } = render(
      <HomeHero
        eyebrow="Portfolio"
        siteConfig={{ ...siteConfig, homeVideoId: "" }}
      />,
    );

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
  });

  it("does not load the video when reduced motion is preferred", () => {
    reducedMotion = true;
    const { container } = render(
      <HomeHero eyebrow="Portfolio" siteConfig={siteConfig} />,
    );

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
  });

  it("stops decorative autoplay when the reduced motion preference turns on", () => {
    const { container } = render(
      <HomeHero eyebrow="Portfolio" siteConfig={siteConfig} />,
    );
    expect(container.querySelector("iframe")).not.toBeNull();

    reducedMotion = true;
    act(() => listeners.forEach((listener) => listener()));

    expect(container.querySelector("iframe")).toBeNull();
  });
});
