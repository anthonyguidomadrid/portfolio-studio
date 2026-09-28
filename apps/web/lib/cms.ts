import sanitizeHtml from "sanitize-html";
import { previewCollection, previewPages } from "@/lib/preview-data";
import type {
  ContentPage,
  ContentPageResult,
  PortfolioCollection,
  PortfolioImage,
  PortfolioItem,
  PortfolioTag,
} from "@/lib/types";

const REVALIDATE_SECONDS = 3600;

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function rendered(value: unknown): string {
  return text(record(value)?.rendered);
}

function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function safeUrl(value: unknown): string | undefined {
  const candidate = text(value).trim();
  if (!candidate) return undefined;

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function ids(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is number => Number.isInteger(entry) && Number(entry) > 0,
  );
}

function metaOf(value: unknown): JsonRecord {
  return record(record(value)?.meta) ?? {};
}

function cmsBaseUrl(): string | undefined {
  const value = process.env.CMS_URL?.trim().replace(/\/+$/, "");
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1"
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

async function fetchWp<T>(path: string, tags: string[]): Promise<T> {
  const baseUrl = cmsBaseUrl();
  if (!baseUrl) throw new Error("CMS_URL is not configured with a valid URL.");

  const response = await fetch(`${baseUrl}/wp-json/wp/v2${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: REVALIDATE_SECONDS, tags },
  });

  if (!response.ok)
    throw new Error(`WordPress REST API responded with ${response.status}.`);
  return response.json() as Promise<T>;
}

function normalizeTag(value: unknown): PortfolioTag | undefined {
  const tag = record(value);
  const name = plainText(text(tag?.name));
  const slug = text(tag?.slug);
  if (!name || !slug) return undefined;
  return { id: typeof tag?.id === "number" ? tag.id : slug, name, slug };
}

function mediaIdsFor(item: unknown): number[] {
  const post = record(item) ?? {};
  const meta = metaOf(item);
  const cover =
    Number(meta.portfolio_cover_image_id) || Number(post.featured_media) || 0;
  return [
    ...new Set(
      [cover, ...ids(meta.portfolio_gallery_image_ids)].filter((id) => id > 0),
    ),
  ];
}

async function fetchMediaMap(
  mediaIds: number[],
): Promise<Map<number, PortfolioImage>> {
  const uniqueIds = [...new Set(mediaIds)];
  if (!uniqueIds.length) return new Map();

  const query = new URLSearchParams({
    include: uniqueIds.join(","),
    per_page: String(uniqueIds.length),
    _fields: "id,source_url,alt_text,caption",
  });
  const media = await fetchWp<unknown[]>(`/media?${query.toString()}`, [
    "portfolio-media",
  ]);
  const result = new Map<number, PortfolioImage>();

  for (const entry of Array.isArray(media) ? media : []) {
    const item = record(entry);
    const id = Number(item?.id);
    const src = safeUrl(item?.source_url);
    if (!id || !src) continue;
    const caption = plainText(rendered(item?.caption));
    result.set(id, {
      src,
      alt: plainText(text(item?.alt_text)) || caption,
      ...(caption ? { caption } : {}),
    });
  }

  return result;
}

function normalizePortfolioItem(
  value: unknown,
  media: Map<number, PortfolioImage>,
  tagMap: Map<number, PortfolioTag>,
): PortfolioItem | undefined {
  const post = record(value);
  if (!post) return undefined;

  const slug = text(post.slug);
  const name = plainText(rendered(post.title));
  if (!slug || !name) return undefined;

  const meta = metaOf(value);
  const coverId =
    Number(meta.portfolio_cover_image_id) || Number(post.featured_media) || 0;
  const imageIds = ids(meta.portfolio_gallery_image_ids);
  const cover =
    media.get(coverId) ?? imageIds.map((id) => media.get(id)).find(Boolean);
  if (!cover) return undefined;

  const gallery = imageIds
    .map((id) => media.get(id))
    .filter((image): image is PortfolioImage => Boolean(image));
  if (!gallery.some((image) => image.src === cover.src)) gallery.unshift(cover);
  const tagIds = ids(post.portfolio_tag);
  const tags = tagIds
    .map((id) => tagMap.get(id))
    .filter((tag): tag is PortfolioTag => Boolean(tag));
  const credits = text(meta.portfolio_credits).trim();
  const description =
    plainText(rendered(post.excerpt)) || plainText(rendered(post.content));

  return {
    id: typeof post.id === "number" ? post.id : slug,
    slug,
    name,
    description,
    cover: { ...cover, alt: cover.alt || cover.caption || description || name },
    gallery: gallery.map((image) => ({
      ...image,
      alt: image.alt || image.caption || description || name,
    })),
    videoUrl: safeUrl(meta.portfolio_video_url),
    ...(credits ? { credits } : {}),
    displayOrder: Number.isFinite(Number(meta.portfolio_display_order))
      ? Number(meta.portfolio_display_order)
      : 0,
    tags,
  };
}

export async function getPortfolioCollection(): Promise<PortfolioCollection> {
  if (!cmsBaseUrl()) return previewCollection;

  try {
    const [rawItems, rawTags] = await Promise.all([
      fetchWp<unknown[]>(
        "/portfolio_item?per_page=100&_fields=id,slug,title,excerpt,content,meta,portfolio_tag,featured_media",
        ["portfolio"],
      ),
      fetchWp<unknown[]>("/portfolio_tag?per_page=100&_fields=id,name,slug", [
        "portfolio-tags",
      ]),
    ]);
    if (!Array.isArray(rawItems) || !Array.isArray(rawTags))
      throw new Error("WordPress returned an unexpected collection shape.");

    const tags: PortfolioTag[] = [];
    const tagMap = new Map<number, PortfolioTag>();
    for (const rawTag of rawTags) {
      const id = Number(record(rawTag)?.id);
      const tag = normalizeTag(rawTag);
      if (id && tag) {
        tags.push(tag);
        tagMap.set(id, tag);
      }
    }

    const mediaIds = rawItems.flatMap(mediaIdsFor);
    const media = await fetchMediaMap(mediaIds);
    const items = rawItems
      .map((item) => normalizePortfolioItem(item, media, tagMap))
      .filter((item): item is PortfolioItem => Boolean(item))
      .sort(
        (left, right) =>
          left.displayOrder - right.displayOrder ||
          left.name.localeCompare(right.name),
      );

    return { items, tags, source: "cms" };
  } catch (error) {
    console.error(
      "Portfolio CMS request failed; serving isolated preview content.",
      error,
    );
    return previewCollection;
  }
}

export async function getPortfolioItem(
  slug: string,
): Promise<PortfolioItem | undefined> {
  const collection = await getPortfolioCollection();
  return collection.items.find((item) => item.slug === slug);
}

const allowedTags = [
  "a",
  "blockquote",
  "br",
  "em",
  "h2",
  "h3",
  "h4",
  "li",
  "ol",
  "p",
  "strong",
  "ul",
];

function safeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: { a: ["href", "name", "rel", "target"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}

export async function getContentPage(
  slug: "about" | "contact",
): Promise<ContentPageResult> {
  const preview = previewPages[slug];
  if (!cmsBaseUrl()) return { page: preview, source: "preview" };

  try {
    const query = new URLSearchParams({
      slug,
      per_page: "1",
      _fields: "slug,title,content",
    });
    const response = await fetchWp<unknown[]>(`/pages?${query.toString()}`, [
      `page-${slug}`,
    ]);
    const item = Array.isArray(response) ? record(response[0]) : undefined;
    const title = plainText(rendered(item?.title));
    if (!item || !title) return { page: preview, source: "cms" };

    const page: ContentPage = {
      slug,
      title,
      contentHtml: safeContent(rendered(item.content)),
    };
    return { page, source: "cms" };
  } catch (error) {
    console.error(
      `WordPress page "${slug}" request failed; serving preview content.`,
      error,
    );
    return { page: preview, source: "preview" };
  }
}
