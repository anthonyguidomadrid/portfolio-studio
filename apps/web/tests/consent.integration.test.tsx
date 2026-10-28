// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsentProvider } from "@/components/consent/provider";
import {
  ConsentInterface,
  CookieSettingsButton,
} from "@/components/consent/interface";
import { YouTubeVideo } from "@/components/youtube-video";
import { CmsPage } from "@/components/cms-page";
import { CONSENT_STORAGE_KEY, createConsent } from "@/lib/consent";

beforeEach(() => {
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
    this.querySelector<HTMLButtonElement>("button")?.focus();
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

function setup() {
  return render(
    <ConsentProvider>
      <CookieSettingsButton />
      <YouTubeVideo
        videoId="dQw4w9WgXcQ"
        title="Selected work"
        aspectRatio="4 / 3"
      />
      <ConsentInterface />
    </ConsentProvider>,
  );
}

describe("consent experience", () => {
  it("server renders no optional resources even with saved consent", () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(createConsent({ analytics: true, youtube: true })),
    );
    const markup = renderToStaticMarkup(
      <ConsentProvider>
        <YouTubeVideo videoId="dQw4w9WgXcQ" title="Work" />
        <ConsentInterface />
      </ConsentProvider>,
    );
    expect(markup).not.toContain("<iframe");
    expect(markup).not.toContain("<script");
    expect(markup).toContain("/video-covers/default.svg");
  });

  it("starts blocked and persists rejection across remounts", async () => {
    const user = userEvent.setup();
    const view = setup();
    expect(view.container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("img").getAttribute("src")).toBe(
      "/video-covers/default.svg",
    );
    await user.click(screen.getByRole("button", { name: "Reject optional" }));
    expect(
      JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!),
    ).toMatchObject({
      version: 1,
      analytics: false,
      youtube: false,
      timestamp: expect.any(String),
    });
    view.unmount();
    const next = setup();
    expect(screen.queryByRole("button", { name: "Accept all" })).toBeNull();
    expect(next.container.querySelector("iframe")).toBeNull();
  });

  it("saves analytics-only, then enables YouTube only from the cover and withdraws it", async () => {
    const user = userEvent.setup();
    const view = setup();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    const boxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(boxes.every((box) => !box.checked)).toBe(true);
    await user.click(boxes[0]);
    await user.click(screen.getByRole("button", { name: "Save preferences" }));
    expect(view.container.querySelector("iframe")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Allow YouTube and play" }),
    );
    expect(
      JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!),
    ).toMatchObject({ analytics: true, youtube: true });
    expect(view.container.querySelector("iframe")?.src).toContain(
      "youtube-nocookie.com/embed/",
    );
    expect(view.container.querySelector("iframe")?.style.aspectRatio).toBe(
      "4 / 3",
    );
    await user.click(screen.getByRole("button", { name: "Cookie Settings" }));
    await user.click(screen.getAllByRole("checkbox")[1]);
    await user.click(screen.getByRole("button", { name: "Save preferences" }));
    expect(view.container.querySelector("iframe")).toBeNull();
  });

  it("YouTube quick acceptance never enables Analytics and survives reload", async () => {
    const user = userEvent.setup();
    const view = setup();
    await user.click(
      screen.getByRole("button", { name: "Allow YouTube and play" }),
    );
    expect(
      JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!),
    ).toMatchObject({ analytics: false, youtube: true });
    view.unmount();
    expect(setup().container.querySelector("iframe")).not.toBeNull();
  });

  it("supports keyboard toggles, cancellation and restoring focus without saving", async () => {
    const user = userEvent.setup();
    setup();
    const opener = screen.getByRole("button", { name: "Cookie Settings" });
    await user.click(opener);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Close settings without saving" }),
    );
    await user.tab();
    await user.keyboard(" ");
    expect(
      (screen.getAllByRole("checkbox")[0] as HTMLInputElement).checked,
    ).toBe(true);
    act(() => {
      screen
        .getByRole("dialog")
        .dispatchEvent(new Event("cancel", { cancelable: true }));
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    await user.click(opener);
    expect(
      (screen.getAllByRole("checkbox")[0] as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("removes players on cross-tab withdrawal", async () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(createConsent({ analytics: false, youtube: true })),
    );
    const view = setup();
    expect(view.container.querySelector("iframe")).not.toBeNull();
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(createConsent({ analytics: false, youtube: false })),
    );
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: CONSENT_STORAGE_KEY }),
      );
    });
    await waitFor(() =>
      expect(view.container.querySelector("iframe")).toBeNull(),
    );
  });

  it("fails closed and remains usable when storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const view = setup();
    expect(view.container.querySelector("iframe")).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Reject optional" }),
    );
    expect(screen.getByRole("status").textContent).toContain("this visit only");
  });

  it("restores focus to the banner opener after cancellation", async () => {
    const user = userEvent.setup();
    setup();
    const opener = screen.getByRole("button", { name: "Settings" });
    await user.click(opener);
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(opener);
  });

  it("enforces expiry at the deadline in an open tab", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-28T11:58:30.000Z"));
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        timestamp: "2026-04-28T12:00:00.000Z",
        analytics: true,
        youtube: true,
      }),
    );
    const view = setup();
    expect(view.container.querySelector("iframe")).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(90_000);
    });
    expect(view.container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("button", { name: "Accept all" })).toBeTruthy();
    vi.useRealTimers();
  });

  it("retains current-visit choices on focus if storage writes fail", async () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(createConsent({ analytics: false, youtube: false })),
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const view = setup();
    await userEvent.click(
      screen.getByRole("button", { name: "Allow YouTube and play" }),
    );
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(view.container.querySelector("iframe")).not.toBeNull();
  });

  it("replaces CMS frames and external YouTube thumbnails with local covers", () => {
    const markup = renderToStaticMarkup(
      <CmsPage
        title="Videos"
        html={
          '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Portrait" width="480" height="640"></iframe><img src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" alt="remote" />'
        }
      />,
    );
    expect(markup).not.toContain("<iframe");
    expect(markup).not.toContain("ytimg.com");
    expect(markup).toContain("480 / 640");
    expect(markup).toContain("Portrait");
  });
});
