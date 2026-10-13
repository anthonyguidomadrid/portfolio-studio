# Architecture

## System overview

This single repository contains a small public Next.js app and a self-hosted WordPress CMS:

- `apps/web`: Next.js App Router, TypeScript, Tailwind CSS v4. Intended for Vercel.
- `apps/wordpress`: custom plugin and Docker build context. WordPress core, database contents, uploads, and credentials remain runtime/deployment data. Intended for Railway.
- Railway MySQL stores WordPress configuration/content. A persistent volume stores WordPress uploads.

The public application includes Home, About, Contact, CV, Portfolio, and portfolio detail routes. These pages currently use the reusable Coming Soon screen. `/robots.txt`, `/sitemap.xml`, and `/api/revalidate` are technical endpoints, not public content pages.

## Frontend and theme

- `apps/web/app/page.tsx` is the single public page. It calls `getSiteConfig()` on the server.
- `apps/web/lib/site-config.ts` fetches `/wp-json/portfolio-studio/v1/settings`, validates the public settings response, and uses a generic preview name when the CMS is unavailable.
- `apps/web/app/layout.tsx` loads Montserrat with `next/font/google` and provides global semantic foreground/background utilities.
- `apps/web/app/globals.css` is the Tailwind v4 CSS-first theme. Semantic colors, typography, widths, gutters, spacing, focus, and radii are declared in `@theme`; there is no conflicting `tailwind.config`.
- `apps/web/components/theme-preview.tsx` is rendered only in development. Theme token usage is documented in `apps/web/THEME.md`.

All CMS requests run on the server. WordPress admin credentials are not required by the public app or exposed to browsers.

## WordPress API boundary

The custom plugin exposes public site settings at `/wp-json/portfolio-studio/v1/settings`: `name`, `description`, `contactEmail`, legacy `socialLinks` (`label`/`href`), and optional `instagramUrl`, `facebookUrl`, `twitterUrl`, `youtubeUrl`, `pinterestUrl`, `tumblrUrl`, and `flickrUrl`. Platform URLs are independently optional and contain only public HTTP(S) URLs. `homeVideoUrl` is an optional string for the Home page video: either `""` or a canonical `https://www.youtube.com/watch?v=<11-char-id>`. WordPress accepts YouTube watch, `youtu.be`, embed, and shorts links, and clears anything else, so the frontend should build its embed URL from the ID rather than trust the string. `homeVideoStart` is an integer number of seconds (0–43200, `0` when unset) at which the Home video begins; WordPress clamps and floors the value. The frontend validates these settings and renders configured platform URLs as icon links in the shared footer. The legacy generic list remains in the response for compatibility but is no longer edited in WordPress or rendered by the frontend. Settings are edited in WordPress **Settings → Portfolio site**.

The plugin also contains the portfolio post type, tag taxonomy, media fields, and page publishing hooks for later use, but no portfolio/About/Contact frontend routes currently consume those features. Add such routes only when scope explicitly expands.

## Environments and publishing

- Local: `docker compose` runs WordPress and MariaDB with named data volumes; run the web app with `npm --prefix apps/web run dev`.
- Vercel: project root is `apps/web`. Set `CMS_URL`, `NEXT_PUBLIC_SITE_URL`, and `REVALIDATION_SECRET` as documented in the root README and example env files.
- Railway: build WordPress from `apps/wordpress`, connect MySQL privately, and mount persistent storage at `/var/www/html/wp-content/uploads`.
- When the WordPress site settings change, the plugin sends a signed POST to `/api/revalidate`. The endpoint validates the shared secret, expires the site-settings cache, and revalidates Home. If WordPress is unavailable, the server uses the generic preview name.

Never commit WordPress core, SQL/database contents, uploads, secrets, or generated build output. Do not deploy or change production domains/secrets without explicit human action. Back up the database and uploads separately and test restoring them together.
