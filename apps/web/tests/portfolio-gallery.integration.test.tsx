// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import type { PortfolioPhoto, PortfolioTag } from "@/lib/portfolio-photos";

const tags: PortfolioTag[] = [
  { id: 1, slug: "editorial", name: "Editorial" },
  { id: 2, slug: "commercial", name: "Commercial" },
];

const photos: PortfolioPhoto[] = [
  {
    id: 10,
    slug: "editorial-one",
    title: "Editorial One",
    displayOrder: 1,
    image: {
      id: 110,
      url: "https://cms.example.test/wp-content/uploads/editorial-one.jpg",
      width: 800,
      height: 1200,
      alt: "Model in a studio",
      caption: "First editorial",
    },
    tags: [tags[0]],
  },
  {
    id: 20,
    slug: "commercial-one",
    title: "Commercial One",
    displayOrder: 2,
    image: {
      id: 120,
      url: "https://cms.example.test/wp-content/uploads/commercial-one.jpg",
      width: 1200,
      height: 800,
      alt: "Product campaign",
      caption: "First commercial",
    },
    tags: [tags[1]],
  },
  {
    id: 30,
    slug: "editorial-two",
    title: "Editorial Two",
    displayOrder: 3,
    image: {
      id: 130,
      url: "https://cms.example.test/wp-content/uploads/editorial-two.jpg",
      width: 800,
      height: 1200,
      alt: "Model by a window",
      caption: "Second editorial",
    },
    tags: [tags[0]],
  },
];

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false;
    },
  });
  window.history.replaceState(null, "", "/portfolio");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/portfolio");
  document.body.style.overflow = "";
});

describe("PortfolioGallery", () => {
  it("renders only one All filter when WordPress includes its reserved all tag", () => {
    render(
      <PortfolioGallery
        initialTag="all"
        items={photos}
        tags={[{ id: 0, slug: "all", name: "All" }, ...tags]}
      />,
    );

    expect(screen.getAllByRole("button", { name: "All" })).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getAllByRole("button", { name: /View photo:/ })).toHaveLength(
      3,
    );
  });

  it("decodes WordPress HTML entities in future tag names", () => {
    render(
      <PortfolioGallery
        initialTag=""
        items={photos}
        tags={[
          {
            id: 3,
            slug: "swimwear-underwear",
            name: "Swimwear &amp; Underwear",
          },
          {
            id: 4,
            slug: "editorial-long-dash",
            name: "Culture &#8212; Editorial",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Swimwear & Underwear" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Culture \u2014 Editorial" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /&amp;/ })).toBeNull();
  });

  it("filters the full collection, preserves order and reflects the tag in the URL", async () => {
    const user = userEvent.setup();
    render(<PortfolioGallery initialTag="" items={photos} tags={tags} />);

    expect(screen.getAllByRole("button", { name: /View photo:/ })).toHaveLength(
      3,
    );
    await user.click(screen.getByRole("button", { name: "Editorial" }));

    const photoButtons = screen.getAllByRole("button", { name: /View photo:/ });
    expect(photoButtons).toHaveLength(2);
    expect(photoButtons[0].getAttribute("aria-label")).toContain(
      "Editorial One",
    );
    expect(photoButtons[1].getAttribute("aria-label")).toContain(
      "Editorial Two",
    );
    expect(window.location.search).toBe("?tag=editorial");

    window.history.replaceState(null, "", "/portfolio?tag=commercial");
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(screen.getAllByRole("button", { name: /View photo:/ })).toHaveLength(
      1,
    );
    expect(
      screen
        .getByRole("button", { name: "Commercial" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("opens the native dialog, navigates by arrows, closes with Escape and restores focus", async () => {
    const user = userEvent.setup();
    render(<PortfolioGallery initialTag="" items={photos} tags={tags} />);
    const firstPhoto = screen.getByRole("button", {
      name: /^View photo: Editorial One/,
    });
    await user.click(firstPhoto);

    const dialog = screen.getByRole("dialog", {
      name: "Portfolio photo viewer",
    });
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("img", { name: "Model in a studio" })).toBeTruthy();
    expect(dialog.className).toContain("p-2");
    expect(dialog.textContent).not.toContain("First editorial");
    expect(
      Array.from(dialog.querySelectorAll("div")).some((element) =>
        element.classList.contains("grid-cols-[2.75rem_minmax(0,1fr)_2.75rem]"),
      ),
    ).toBe(true);

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("img", { name: "Product campaign" })).toBeTruthy();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("img", { name: "Model in a studio" })).toBeTruthy();
    await user.keyboard("{Escape}");

    expect(dialog.hasAttribute("open")).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(firstPhoto);
  });

  it("shows an explicit empty state when a tag has no matching photos", () => {
    render(
      <PortfolioGallery
        initialTag="unmatched"
        items={photos}
        tags={[{ id: 3, slug: "unmatched", name: "Unmatched" }]}
      />,
    );

    expect(screen.getByText("No photos match this tag.")).toBeTruthy();
  });
});
