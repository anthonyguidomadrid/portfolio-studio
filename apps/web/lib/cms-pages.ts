// Must match the page slugs the WordPress plugin sends revalidation events for.
export const CMS_PAGE_SLUGS = ["about", "contact"] as const;

export type CmsPageSlug = (typeof CMS_PAGE_SLUGS)[number];

export function isCmsPageSlug(value: unknown): value is CmsPageSlug {
  return (CMS_PAGE_SLUGS as readonly unknown[]).includes(value);
}

export function cmsPageCacheTag(slug: CmsPageSlug): string {
  return `wp-page-${slug}`;
}
