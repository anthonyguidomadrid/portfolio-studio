import sanitizeHtml from "sanitize-html";
import { cmsPageCacheTag, type CmsPageSlug } from "@/lib/cms-pages";
import type { SocialUrls } from "@/lib/site-config";

export interface CmsPageContent {
  title: string;
  html: string;
  socialUrls: Partial<SocialUrls>;
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

function extractSocialUrls(html: string): Partial<SocialUrls> {
  const socialUrls: Partial<SocialUrls> = {};
  sanitizeHtml(html, {
    allowedTags: ["a"],
    allowedAttributes: { a: ["href"] },
    transformTags: {
      a: (tagName, attribs) => {
        if (typeof attribs.href === "string") {
          try {
            const url = new URL(attribs.href);
            if (url.protocol === "https:") {
              if (
                ["instagram.com", "www.instagram.com"].includes(url.hostname)
              ) {
                socialUrls.instagram ??= url.toString();
              }
              if (
                ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(
                  url.hostname,
                )
              ) {
                socialUrls.youtube ??= url.toString();
              }
            }
          } catch {
            // Ignore malformed or unsafe social URLs.
          }
        }
        return { tagName, attribs };
      },
    },
    allowedSchemes: ["https"],
    allowProtocolRelative: false,
  });
  return socialUrls;
}

export function sanitizePageHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "div",
      "h1",
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
      "iframe",
      "figure",
      "figcaption",
      "code",
      "pre",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      div: ["style", "aria-hidden"],
      img: ["src", "alt", "width", "height", "loading", "decoding"],
      iframe: [
        "src",
        "title",
        "width",
        "height",
        "allow",
        "allowfullscreen",
        "loading",
        "referrerpolicy",
      ],
    },
    // Only the Columns block hooks; other WordPress classes carry no styling here.
    allowedClasses: {
      div: [
        "wp-block-columns",
        "wp-block-column",
        "wp-block-spacer",
        "are-vertically-aligned-*",
        "is-vertically-aligned-*",
        "is-not-stacked-on-mobile",
        "wp-block-button",
        "is-style-outline",
        "is-style-outline--*",
      ],
      ul: ["wp-block-social-links"],
      li: ["wp-social-link", "wp-social-link-*", "wp-block-social-link"],
      a: ["wp-block-button__link", "wp-element-button"],
      p: ["eyebrow"],
    },
    // WordPress writes a column's custom width as a percentage flex-basis.
    allowedStyles: {
      div: {
        "flex-basis": [/^\d{1,3}(\.\d+)?%$/],
        height: [/^\d{1,4}(\.\d+)?px$/],
      },
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https", "http"], iframe: ["https"] },
    allowedIframeHostnames: [
      "youtube.com",
      "www.youtube.com",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
    ],
    allowProtocolRelative: false,
    transformTags: {
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
      iframe: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy" },
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

  return {
    title: plainTitle,
    html: sanitizePageHtml(content).trim(),
    socialUrls: extractSocialUrls(content),
  };
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
      next: { revalidate: false, tags: [cmsPageCacheTag(slug)] },
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
