// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://portfolio.example.test/"}

import { act, cleanup, render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  consent: { ready: false, choices: { analytics: false, youtube: false } },
  pathname: "/portfolio",
  search: "",
}));

vi.mock("@/components/consent/provider", () => ({
  useConsent: () => state.consent,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useSearchParams: () => new URLSearchParams(state.search),
}));

type TestWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...command: unknown[]) => void;
  "ga-disable-G-TENRH5WP8L"?: boolean;
};

const browser = window as TestWindow;
let Analytics: typeof import("@/components/consent/analytics").Analytics;
let disableAnalytics: typeof import("@/lib/analytics").disableAnalytics;

function script(): HTMLScriptElement | null {
  return document.querySelector("script[data-portfolio-analytics]");
}

function commands(): unknown[][] {
  return (browser.dataLayer ?? []).map((entry) =>
    Array.from(entry as ArrayLike<unknown>),
  );
}

function pageViews(): unknown[][] {
  return commands().filter(
    (entry) => entry[0] === "event" && entry[1] === "page_view",
  );
}

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TENRH5WP8L");
  state.consent = {
    ready: false,
    choices: { analytics: false, youtube: false },
  };
  state.pathname = "/portfolio";
  state.search = "";
  delete browser.dataLayer;
  delete browser.gtag;
  delete browser["ga-disable-G-TENRH5WP8L"];
  ({ disableAnalytics } = await import("@/lib/analytics"));
  ({ Analytics } = await import("@/components/consent/analytics"));
});

afterEach(() => {
  cleanup();
  disableAnalytics();
  document
    .querySelectorAll("script[data-portfolio-analytics]")
    .forEach((element) => element.remove());
  window.history.replaceState(null, "", "/");
  vi.unstubAllEnvs();
});

describe("consent-gated analytics", () => {
  it("does not load or queue anything before hydration or without analytics consent", () => {
    state.consent.choices.analytics = true;
    const view = render(<Analytics />);
    expect(script()).toBeNull();
    expect(browser.dataLayer).toBeUndefined();
    state.consent = {
      ready: true,
      choices: { analytics: false, youtube: true },
    };
    view.rerender(<Analytics />);
    expect(script()).toBeNull();
    expect(browser.gtag).toBeUndefined();
  });

  it.each(["", "not-a-measurement-id"])(
    "does nothing with missing or invalid ID %j",
    (id) => {
      vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", id);
      state.consent = {
        ready: true,
        choices: { analytics: true, youtube: false },
      };
      render(<Analytics />);
      expect(script()).toBeNull();
      expect(browser.dataLayer).toBeUndefined();
      expect(browser["ga-disable-G-TENRH5WP8L"]).toBeUndefined();
    },
  );

  it("initializes once and sends one initial and subsequent route view in StrictMode", () => {
    state.consent = {
      ready: true,
      choices: { analytics: true, youtube: false },
    };
    const view = render(
      <StrictMode>
        <Analytics />
      </StrictMode>,
    );
    const initialScript = script()!;
    expect(
      document.querySelectorAll("script[data-portfolio-analytics]"),
    ).toHaveLength(1);
    expect(initialScript.src).toBe(
      "https://www.googletagmanager.com/gtag/js?id=G-TENRH5WP8L",
    );
    expect(commands()).toEqual([]);
    act(() => initialScript.dispatchEvent(new Event("load")));
    expect(commands().filter((entry) => entry[0] === "config")).toEqual([
      [
        "config",
        "G-TENRH5WP8L",
        {
          send_page_view: false,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        },
      ],
    ]);
    expect(pageViews()).toHaveLength(1);
    view.rerender(
      <StrictMode>
        <Analytics />
      </StrictMode>,
    );
    act(() => initialScript.dispatchEvent(new Event("load")));
    expect(pageViews()).toHaveLength(1);
    state.search = "category=portraits";
    view.rerender(
      <StrictMode>
        <Analytics />
      </StrictMode>,
    );
    state.pathname = "/about";
    state.search = "";
    view.rerender(
      <StrictMode>
        <Analytics />
      </StrictMode>,
    );
    expect(
      pageViews().map((entry) => (entry[2] as { page_path: string }).page_path),
    ).toEqual(["/portfolio", "/portfolio?category=portraits", "/about"]);
    window.history.replaceState(null, "", "/#credits");
    view.rerender(
      <StrictMode>
        <Analytics />
      </StrictMode>,
    );
    expect(pageViews()).toHaveLength(3);
    expect(
      pageViews().every(
        (entry) =>
          !(entry[2] as { page_location: string }).page_location.includes("#"),
      ),
    ).toBe(true);
    expect(commands().filter((entry) => entry[0] === "config")).toHaveLength(1);
  });

  it("tracks each route once if navigation precedes script load", () => {
    state.consent = {
      ready: true,
      choices: { analytics: true, youtube: false },
    };
    const view = render(<Analytics />);
    state.pathname = "/about";
    view.rerender(<Analytics />);
    act(() => script()!.dispatchEvent(new Event("load")));
    expect(
      pageViews().map((entry) => (entry[2] as { page_path: string }).page_path),
    ).toEqual(["/portfolio", "/about"]);
  });

  it("synchronously withdraws before load and ignores an already captured load handler", () => {
    state.consent = {
      ready: true,
      choices: { analytics: true, youtube: false },
    };
    const view = render(<Analytics />);
    const initialScript = script()!;
    const lateLoad = initialScript.onload!;
    browser.gtag?.("event", "queued-before-load");
    browser.dataLayer!.push({ unrelated: true });
    disableAnalytics();
    expect(browser["ga-disable-G-TENRH5WP8L"]).toBe(true);
    expect(script()).toBeNull();
    expect(browser.dataLayer).toEqual([{ unrelated: true }]);
    act(() => lateLoad.call(initialScript, new Event("load")));
    browser.gtag?.("event", "after-withdrawal");
    expect(browser.dataLayer).toEqual([{ unrelated: true }]);
    state.consent.choices.analytics = false;
    view.rerender(<Analytics />);
    state.consent.choices.analytics = true;
    view.rerender(<Analytics />);
    expect(script()).not.toBe(initialScript);
    act(() => lateLoad.call(initialScript, new Event("load")));
    expect(pageViews()).toHaveLength(0);
    act(() => script()!.dispatchEvent(new Event("load")));
    expect(pageViews()).toHaveLength(1);
  });

  it("blocks subsequent events, clears owned commands, and reaccepts without configuring twice", () => {
    state.consent = {
      ready: true,
      choices: { analytics: true, youtube: false },
    };
    const gtag = vi.fn();
    browser.gtag = gtag;
    const view = render(<Analytics />);
    act(() => script()!.dispatchEvent(new Event("load")));
    expect(
      gtag.mock.calls.filter((entry) => entry[0] === "event"),
    ).toHaveLength(1);
    disableAnalytics();
    expect(browser["ga-disable-G-TENRH5WP8L"]).toBe(true);
    state.consent.choices.analytics = false;
    state.pathname = "/contact";
    view.rerender(<Analytics />);
    expect(
      gtag.mock.calls.filter((entry) => entry[0] === "event"),
    ).toHaveLength(1);
    state.consent.choices.analytics = true;
    view.rerender(<Analytics />);
    expect(browser["ga-disable-G-TENRH5WP8L"]).toBe(false);
    expect(script()).toBeNull();
    expect(
      gtag.mock.calls.filter((entry) => entry[0] === "event"),
    ).toHaveLength(2);
    expect(
      gtag.mock.calls.filter((entry) => entry[0] === "config"),
    ).toHaveLength(1);
  });

  it("clears queued commands after initialized withdrawal without replaying on reacceptance", () => {
    state.consent = {
      ready: true,
      choices: { analytics: true, youtube: false },
    };
    const view = render(<Analytics />);
    act(() => script()!.dispatchEvent(new Event("load")));
    expect(commands()).toHaveLength(3);
    disableAnalytics();
    expect(commands()).toEqual([]);
    state.consent.choices.analytics = false;
    view.rerender(<Analytics />);
    state.consent.choices.analytics = true;
    view.rerender(<Analytics />);
    expect(commands().map((entry) => entry[0])).toEqual(["event"]);
  });

  it("removes only GA cookies at visible paths, host, and parent domains", () => {
    window.history.replaceState(null, "", "/portfolio/project");
    const hostname = window.location.hostname;
    document.cookie = "_ga=host; Path=/";
    document.cookie = `_ga_TEST=domain; Path=/portfolio; Domain=${hostname}`;
    document.cookie = "_gid=path; Path=/portfolio/project";
    document.cookie = "_gat_gtag_TEST=throttle; Path=/";
    document.cookie = "preferences=keep; Path=/";
    document.cookie = "_gallery=keep; Path=/";
    const cookieSetter = vi.spyOn(document, "cookie", "set");
    disableAnalytics();
    expect(document.cookie).not.toMatch(/(?:^|; )_(?:ga(?:_|=)|gid=|gat)/);
    expect(document.cookie).toContain("preferences=keep");
    expect(document.cookie).toContain("_gallery=keep");
    const assignments = cookieSetter.mock.calls.map(([value]) => value);
    expect(assignments).toContain(
      `_ga=; Max-Age=0; Path=/; Domain=.${hostname}`,
    );
    const parent = hostname.split(".").slice(1).join(".");
    if (parent)
      expect(assignments).toContain(
        `_ga=; Max-Age=0; Path=/; Domain=.${parent}`,
      );
    expect(assignments.every((value) => !value.includes("google.com"))).toBe(
      true,
    );
    expect(
      assignments.every(
        (value) =>
          !value.startsWith("preferences=") && !value.startsWith("_gallery="),
      ),
    ).toBe(true);
  });
});
