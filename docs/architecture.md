# Architecture

## System overview

The repository contains a single Git project with two independently deployed applications:

- `apps/web`: public Next.js App Router application, TypeScript, Tailwind CSS v4, and `next-intl`. Intended for Vercel.
- `apps/wordpress`: a Docker build context containing the upstream WordPress image recipe and the version-controlled `portfolio-studio` custom plugin. Intended for Railway.
- Railway MySQL stores WordPress content and configuration. A Railway persistent volume stores WordPress uploads. Database contents, uploads, WordPress core, and credentials are runtime/deployment data, not Git content.

The public routes are `/`, `/about`, `/portfolio`, `/portfolio/[slug]`, and `/contact`, with a custom not-found page. The videobook is a portfolio item, conventionally slugged `videobook` and tagged `Video`, not a separate top-level route.

## Frontend

- App Router entrypoints are under `apps/web/app`.
- Shared navigation, cards, tag filter, image gallery, video embed, and locale selector are under `apps/web/components`.
- Tailwind v4 uses `apps/web/postcss.config.mjs`; design tokens and Tailwind layers are in `apps/web/app/globals.css`.
- `apps/web/messages/en.json` and `es.json` own translated interface labels. The selected locale is stored in the `NEXT_LOCALE` cookie; current routes remain unprefixed.
- `apps/web/lib/cms.ts` reads and validates public WordPress REST data. `apps/web/lib/site-config.ts` reads WordPress site settings and supplies generic preview fallback values only when CMS settings are unavailable.
- CMS fetches are server-side and cached with Next.js tags/time windows. WordPress admin credentials are not required or exposed to the frontend.

## CMS content model and API boundary

The custom plugin registers:

- `portfolio_item` at `/wp-json/wp/v2/portfolio_item`.
- `portfolio_tag` at `/wp-json/wp/v2/portfolio_tag`.
- Portfolio metadata: `portfolio_cover_image_id` (attachment ID), `portfolio_gallery_image_ids` (attachment ID array), `portfolio_video_url` (URL), `portfolio_credits` (text), and `portfolio_display_order` (integer).
- Standard WordPress Pages with `about` and `contact` slugs for editable copy.
- Public site settings at `/wp-json/portfolio-studio/v1/settings`: `name`, `description`, `contactEmail`, and `socialLinks` (`label`/`href`). Only explicitly public values are returned.

The standard WordPress REST API is the content contract. Public frontend reads published content without an admin credential. CMS-authored copy and WordPress media alt text remain owned in WordPress. UI labels are translated in the frontend message catalogs. Brand name, description, contact address, and social links are configured in WordPress Settings → Portfolio site.

## Environments and deployment

- Local: `docker compose` runs WordPress and MariaDB with named database, WordPress, and uploads volumes. The frontend is started with `npm --prefix apps/web run dev`.
- Vercel: repository root directory is `apps/web`. `CMS_URL` points to the public WordPress origin, `NEXT_PUBLIC_SITE_URL` is the canonical frontend origin, and `REVALIDATION_SECRET` is a private shared webhook value.
- Railway: build the WordPress image from `apps/wordpress`, attach Railway MySQL through private service variables, and mount persistent storage specifically at `/var/www/html/wp-content/uploads`.
- The root README documents environment variables, setup, DNS, backups, and platform settings. No production domains, accounts, or secrets are committed here.

## Publishing and revalidation flow

1. An editor publishes or updates a portfolio item or the About/Contact pages in WordPress. Site branding changes are saved under Settings → Portfolio site.
2. The plugin sends a non-blocking POST to the frontend `/api/revalidate` endpoint using `Authorization: Bearer <REVALIDATION_SECRET>`.
3. The frontend compares the secret in constant time, validates the event type and slug, expires the associated cache tags, and invalidates affected routes.
4. On the next request, the Next.js server fetches fresh public REST content. If WordPress is unavailable, isolated preview data/config is used and logged; no admin credential is exposed.

Portfolio events refresh Home, Portfolio, the affected detail route, and sitemap. About/Contact events refresh their page. Site-settings events refresh tagged settings and the routes that display brand values.

## Operational constraints

- Never commit WordPress core, SQL/database contents, uploads, secrets, or generated builds.
- Keep WP and Vercel secrets in service environment variables; use the same webhook secret on both services.
- Back up the database and uploads volume independently and test restoring them together.
- No visitor auth, ecommerce, blog, newsletter, analytics, autonomous daemon, or external orchestration is part of this foundation.
