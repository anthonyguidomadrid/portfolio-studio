import sanitizeHtml from "sanitize-html";
import { cmsPageCacheTag, type CmsPageSlug } from "@/lib/cms-pages";

export interface CmsPageContent {
  title: string;
  html: string;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
};

// Rendered titles are HTML; React escapes text, so decode back to plain text.
function toPlainText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;|&lt;|&gt;|&quot;/g, (entity) => ENTITIES[entity])
    .trim();
}

export function sanitizePageHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "div",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "blockquote",
      "strong",
      "em",
      "b",
      "i",
      "a",
      "img",
      "figure",
      "figcaption",
      "code",
      "pre",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      div: ["style"],
      img: ["src", "alt", "width", "height", "loading", "decoding"],
    },
    // Only the Columns block hooks; other WordPress classes carry no styling here.
    allowedClasses: {
      div: [
        "wp-block-columns",
        "wp-block-column",
        "are-vertically-aligned-*",
        "is-vertically-aligned-*",
        "is-not-stacked-on-mobile",
      ],
    },
    // WordPress writes a column's custom width as a percentage flex-basis.
    allowedStyles: {
      div: { "flex-basis": [/^\d{1,3}(\.\d+)?%$/] },
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https", "http"] },
    allowProtocolRelative: false,
    transformTags: {
      // The page title is the only h1 on the route.
      h1: "h2",
      a: (tagName, attribs) => {
        const attributes = { ...attribs };
        if (attributes.target === "_blank") {
          attributes.rel = "noopener noreferrer";
        } else {
          delete attributes.target;
          delete attributes.rel;
        }
        return { tagName, attribs: attributes };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy", decoding: "async" },
      }),
    },
  });
}

function normalizePage(
  value: unknown,
  slug: CmsPageSlug,
): CmsPageContent | undefined {
  if (!Array.isArray(value)) return undefined;

  const page = value.find(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null && item.slug === slug,
  );
  const title = (page?.title as { rendered?: unknown } | undefined)?.rendered;
  const content = (page?.content as { rendered?: unknown } | undefined)
    ?.rendered;
  if (typeof title !== "string" || typeof content !== "string") {
    return undefined;
  }

  const plainTitle = toPlainText(title).slice(0, 160);
  if (!plainTitle) return undefined;

  return { title: plainTitle, html: sanitizePageHtml(content).trim() };
}

export async function getPage(
  slug: CmsPageSlug,
): Promise<CmsPageContent | undefined> {
  const cmsUrl = process.env.CMS_URL?.trim().replace(/\/+$/, "");
  if (!cmsUrl) return undefined;

  const url = new URL(`${cmsUrl}/wp-json/wp/v2/pages`);
  url.searchParams.set("slug", slug);
  url.searchParams.set("_fields", "slug,title,content");

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600, tags: [cmsPageCacheTag(slug)] },
    });
    if (!response.ok) {
      throw new Error(`WordPress pages responded with ${response.status}.`);
    }

    return normalizePage(await response.json(), slug);
  } catch (error) {
    console.error(`WordPress "${slug}" page request failed.`, error);
    return undefined;
  }
}
