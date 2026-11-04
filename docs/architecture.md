# Architecture

## System overview

This single repository contains a small public Next.js app and a self-hosted WordPress CMS:

- `apps/web`: Next.js App Router, TypeScript, Tailwind CSS v4. Intended for Vercel.
- `apps/wordpress`: custom plugin and Docker build context. WordPress core, database contents, uploads, and credentials remain runtime/deployment data. Intended for Railway.
- Railway MySQL stores WordPress configuration/content. A persistent volume stores WordPress uploads.

The public application includes Home, About, Contact, Portfolio, Videos, and Legal routes. Home reads WordPress site settings; About, Contact, Videos, and Legal read published WordPress Pages; `/portfolio` renders its published WordPress page content and a curated photo gallery from the portfolio photos API. Gallery photos open in a lightbox; `/portfolio/[slug]` is not a supported route. `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, icons, and `/api/revalidate` are technical endpoints, not public content pages.

## Frontend and theme

- `apps/web/lib/site-config.ts` fetches `/wp-json/portfolio-studio/v1/settings`, validates public settings, SEO defaults, Person data, sameAs links, and local WordPress media URLs, and uses generic preview settings when the CMS is unavailable.
- `apps/web/lib/wordpress-page.ts` fetches the published page by slug, requests `slug,title,content,seo`, validates SEO fields, sanitizes editorial HTML, and caches by page tag.
- `apps/web/lib/seo-metadata.ts` builds titles, descriptions, canonicals, Open Graph, and Twitter metadata from per-page overrides and site defaults.
- `apps/web/lib/structured-data.ts` and `apps/web/components/structured-data.tsx` emit server-rendered, safely serialized Schema.org `WebSite` and page JSON-LD. `Person` is emitted only when WordPress has a configured public person name; About links its `ProfilePage` to that person.
- `apps/web/app/layout.tsx` loads Montserrat with `next/font/google`, provides global semantic foreground/background utilities, and emits the shared website structured data.
- `apps/web/app/globals.css` is the Tailwind v4 CSS-first theme. Semantic colors, typography, widths, gutters, spacing, focus, and radii are declared in `@theme`; there is no conflicting `tailwind.config`.
- `apps/web/components/theme-preview.tsx` is rendered only in development. Theme token usage is documented in `apps/web/THEME.md`.

All CMS requests run on the server. WordPress admin credentials are not required by the public app or exposed to browsers.

## WordPress API boundary

The custom plugin exposes public site settings at `/wp-json/portfolio-studio/v1/settings`: `name`, `description`, `contactEmail`, legacy `socialLinks` (`label`/`href`), and optional `instagramUrl`, `facebookUrl`, `twitterUrl`, `youtubeUrl`, `pinterestUrl`, `tumblrUrl`, and `flickrUrl`. Platform URLs are independently optional and contain only public HTTP(S) URLs. `homeVideoUrl` is an optional YouTube URL normalized to a canonical watch URL containing an 11-character video ID; the frontend builds its embed URL from the validated ID. `homeVideoStart` is an integer number of seconds (0–43200, `0` when unset). Settings also include public 404 image data and `seo.home`, `seo.defaultImage`, and optional `seo.person`. The Person response contains only configured fields and reuses the site social URLs for `sameAs`; it is `null` until a name is configured. The legacy generic social list remains for compatibility but is no longer edited or rendered. Settings are edited in **Settings → Portfolio site** and **Settings → Portfolio SEO**.

Published WordPress Pages expose an additive public `seo` REST field. Page meta writes require WordPress authentication and `edit_post`; settings writes use the Settings API and `manage_options`. Sharing and 404 images are restricted to eligible public local uploads. For About and Contact, images with empty alt use attachment Alternative Text when available. See the plugin [SEO contract](../apps/wordpress/plugins/portfolio-studio/SEO-API.md) and [image-alt contract](../apps/wordpress/plugins/portfolio-studio/PAGE-IMAGE-ALT.md).

The WordPress plugin exposes the public photo collection at `/wp-json/portfolio-studio/v1/photos`. The frontend validates the response and CMS upload URLs, fetches pages for complete tag filtering, preserves display order, and caches responses under `wp-portfolio-photos`. Portfolio publish/media/tag changes send an authenticated collection event; the frontend expires that cache and revalidates `/portfolio`. See `apps/wordpress/plugins/portfolio-studio/PHOTOS-API.md` for the response contract and editorial workflow.

The Portfolio listing renders sanitized editorial content above the photo gallery. CMS page content, site settings, and photo responses use tagged Next.js data caching with indefinite revalidation until an authenticated event expires the tag. A rebuild alone may reuse the persistent data cache, so publish/update events or manually invalidate the affected tag when releasing changed CMS data. WordPress hooks send page events for supported frontend slugs and settings events for global SEO/site settings; delivery is best-effort, without a persistent retry queue.

## Environments and publishing

- Local: `docker compose` runs WordPress and MariaDB with named data volumes; run the web app with `npm --prefix apps/web run dev`. The root `.env` supplies Compose/WordPress values; `apps/web/.env.local` supplies frontend values.
- Vercel: project root is `apps/web`. Set `CMS_URL`, `NEXT_PUBLIC_SITE_URL`, and `REVALIDATION_SECRET` in the frontend build environment. `NEXT_PUBLIC_SITE_URL` must be the public frontend origin before build; URL generation falls back to localhost if missing/invalid.
- Railway: build WordPress from `apps/wordpress`, connect MySQL privately, and mount persistent storage at `/var/www/html/wp-content/uploads`.
- WordPress sends signed POST events to `/api/revalidate`. The endpoint validates the shared secret, expires `site-settings`, supported page, or portfolio photo cache tags, and revalidates the associated routes. If WordPress is unavailable, server-side fetches use generic preview settings/content fallbacks.

Never commit WordPress core, SQL/database contents, uploads, secrets, or generated build output. Do not deploy or change production domains/secrets without explicit human action. Back up the database and uploads separately and test restoring them together.
