export interface PortfolioTag {
  id: number;
  slug: string;
  name: string;
}

export interface PortfolioPhoto {
  id: number;
  slug: string;
  title: string;
  displayOrder: number;
  image: {
    id: number;
    url: string;
    width: number;
    height: number;
    alt: string;
    caption: string;
  };
  tags: PortfolioTag[];
}

export interface PortfolioCollection {
  status: "available" | "unavailable";
  items: PortfolioPhoto[];
  tags: PortfolioTag[];
}

interface PortfolioApiPage {
  items: unknown[];
  tags: unknown[];
  total: number;
  totalPages: number;
  page: number;
}

const PAGE_SIZE = 100;
const MAX_PAGES = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTag(value: unknown): PortfolioTag | undefined {
  if (!isRecord(value)) return undefined;
  if (
    !Number.isSafeInteger(value.id) ||
    typeof value.slug !== "string" ||
    !value.slug ||
    typeof value.name !== "string" ||
    !value.name.trim()
  ) {
    return undefined;
  }
  return { id: value.id as number, slug: value.slug, name: value.name.trim() };
}

function parsePhoto(
  value: unknown,
  cmsOrigin: string,
): PortfolioPhoto | undefined {
  if (
    !isRecord(value) ||
    !isRecord(value.image) ||
    !Array.isArray(value.tags)
  ) {
    return undefined;
  }

  const image = value.image;
  const imageUrl = typeof image.url === "string" ? image.url : "";
  let normalizedImageUrl: string;
  try {
    const parsedUrl = new URL(imageUrl);
    if (
      parsedUrl.origin !== cmsOrigin ||
      parsedUrl.username !== "" ||
      parsedUrl.password !== "" ||
      !parsedUrl.pathname.startsWith("/wp-content/uploads/")
    ) {
      return undefined;
    }
    normalizedImageUrl = parsedUrl.toString();
  } catch {
    return undefined;
  }

  const parsedTags = value.tags.map(parseTag);
  if (
    !Number.isSafeInteger(value.id) ||
    typeof value.slug !== "string" ||
    !value.slug ||
    typeof value.title !== "string" ||
    !Number.isSafeInteger(value.displayOrder) ||
    !Number.isSafeInteger(image.id) ||
    !Number.isSafeInteger(image.width) ||
    (image.width as number) < 1 ||
    !Number.isSafeInteger(image.height) ||
    (image.height as number) < 1 ||
    typeof image.alt !== "string" ||
    typeof image.caption !== "string" ||
    parsedTags.some((tag) => !tag)
  ) {
    return undefined;
  }

  return {
    id: value.id as number,
    slug: value.slug,
    title: value.title,
    displayOrder: value.displayOrder as number,
    image: {
      id: image.id as number,
      url: normalizedImageUrl,
      width: image.width as number,
      height: image.height as number,
      alt: image.alt,
      caption: image.caption,
    },
    tags: parsedTags as PortfolioTag[],
  };
}

function parsePage(
  value: unknown,
  expectedPage: number,
): PortfolioApiPage | undefined {
  if (!isRecord(value)) return undefined;
  if (
    !Array.isArray(value.items) ||
    !Array.isArray(value.tags) ||
    !Number.isSafeInteger(value.total) ||
    (value.total as number) < 0 ||
    !Number.isSafeInteger(value.totalPages) ||
    (value.totalPages as number) < 0 ||
    value.page !== expectedPage
  ) {
    return undefined;
  }
  return {
    items: value.items,
    tags: value.tags,
    total: value.total as number,
    totalPages: value.totalPages as number,
    page: expectedPage,
  };
}

function unavailableCollection(): PortfolioCollection {
  return { status: "unavailable", items: [], tags: [] };
}

export async function getPortfolioCollection(): Promise<PortfolioCollection> {
  const cmsUrl = process.env.CMS_URL?.trim().replace(/\/+$/, "");
  if (!cmsUrl) return unavailableCollection();

  let endpoint: URL;
  try {
    endpoint = new URL(`${cmsUrl}/wp-json/portfolio-studio/v1/photos`);
    if (!["http:", "https:"].includes(endpoint.protocol)) {
      return unavailableCollection();
    }
  } catch {
    return unavailableCollection();
  }

  const items: PortfolioPhoto[] = [];
  let tags: PortfolioTag[] | undefined;
  let expectedTotalPages: number | undefined;

  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url = new URL(endpoint);
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", String(PAGE_SIZE));
      url.searchParams.set("tag", "all");
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: false, tags: ["wp-portfolio-photos"] },
      });
      if (!response.ok) {
        throw new Error(`WordPress photos responded with ${response.status}.`);
      }

      const body = parsePage(await response.json(), page);
      if (!body || body.totalPages > MAX_PAGES) {
        throw new Error("WordPress photo response had an invalid shape.");
      }
      const totalPages = body.totalPages === 0 ? 1 : body.totalPages;
      if (
        expectedTotalPages !== undefined &&
        expectedTotalPages !== totalPages
      ) {
        throw new Error("WordPress photo collection changed while paginating.");
      }
      expectedTotalPages = totalPages;

      if (!tags) {
        const parsedTags = body.tags.map(parseTag);
        if (parsedTags.some((tag) => !tag)) {
          throw new Error("WordPress photo tags had an invalid shape.");
        }
        tags = parsedTags as PortfolioTag[];
      }

      const parsedItems = body.items.map((item) =>
        parsePhoto(item, endpoint.origin),
      );
      if (parsedItems.some((item) => !item)) {
        throw new Error("WordPress photo items had an invalid shape.");
      }
      items.push(...(parsedItems as PortfolioPhoto[]));

      if (body.total === 0 || page >= totalPages) {
        if (items.length !== body.total) {
          throw new Error("WordPress photo count did not match its pages.");
        }
        return { status: "available", items, tags: tags ?? [] };
      }
    }
    throw new Error("WordPress photo collection exceeded the page limit.");
  } catch (error) {
    console.error("WordPress portfolio photos request failed.", error);
    return unavailableCollection();
  }
}
