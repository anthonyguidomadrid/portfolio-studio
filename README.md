# Portfolio Studio

A reusable headless portfolio foundation: a Next.js App Router frontend in `apps/web` and a small custom WordPress plugin in `apps/wordpress`. WordPress core, database files, uploaded media, build output, and deployment credentials are not stored in this repository.

## Structure

```text
apps/
  web/                              Next.js + TypeScript public site
    app/                            Routes, metadata, sitemap, and revalidation handler
    components/                     Shared navigation, cards, filters, gallery, and video
    i18n/request.ts                  Locale resolution and message loading
    messages/                        English and Spanish interface catalogs
    lib/site-config.ts              Validated WordPress brand settings client
    lib/preview-data.ts             Temporary, isolated local preview content
    lib/cms.ts                      Typed, defensive WordPress REST client
  wordpress/
    Dockerfile                      WordPress image with the custom plugin
    plugins/portfolio-studio/       Version-controlled content model and admin UI
docker-compose.yml                  Local WordPress + MariaDB with named data volumes
```

The app uses Tailwind CSS v4 through `postcss.config.mjs`; visual tokens are in the `@theme` block of `apps/web/app/globals.css`, with responsive Tailwind utility compositions in its component layer. `next-intl` provides English and Spanish interface catalogs. English is the default; the header language selector stores the choice in a `NEXT_LOCALE` cookie without changing the public route paths. CMS-authored page and portfolio copy remains in WordPress.

## Development Coordination

Repository architecture and agent boundaries are documented in [`docs/architecture.md`](docs/architecture.md). Use [`docs/agent-workflow.md`](docs/agent-workflow.md) to plan one issue/branch/PR at a time, and [`docs/backlog.md`](docs/backlog.md) for the dependency-ordered initial audit backlog. In Copilot Chat, select or mention the `coordinator` agent to break a feature request into bounded issues before assigning `frontend` or `wordpress` implementation work and a read-only `reviewer` pass.

## Requirements

- Node.js 20.9 or later and npm
- Docker Desktop or another Docker Compose runtime for local WordPress
- Railway, Vercel, and a domain registrar account for hosted deployment

## Local Development

1. Copy the root `.env.example` to `.env`. Replace the local-only database passwords and webhook placeholder with your own values.
2. Copy `apps/web/.env.example` to `apps/web/.env.local`. Keep `NEXT_PUBLIC_SITE_URL` and `REVALIDATION_SECRET` identical to the values in root `.env`; keep `CMS_URL` at `http://localhost:8080`.
3. Start WordPress and MariaDB from the repository root:

   ```sh
   docker compose up -d --build
   ```

4. Visit `http://localhost:8080`, complete the WordPress installation, and activate **Portfolio Studio Content** under Plugins. The plugin is mounted from `apps/wordpress/plugins/portfolio-studio`.
5. In **Settings → Portfolio site**, set the site name, description, contact email, and social links. The public frontend reads them from `/wp-json/portfolio-studio/v1/settings`.
6. Create published WordPress pages with the exact slugs `about` and `contact`. Add portfolio items and tags; set each item's cover, gallery, optional video URL, credits, and display order in its Portfolio details panel.
7. Start the public site:

   ```sh
   npm --prefix apps/web run dev
   ```

   Open `http://localhost:3000`. With no CMS configured or while WordPress is unavailable, a clearly marked preview dataset is used. Its sample copy and Unsplash image URLs live only in `apps/web/lib/preview-data.ts`; replace or remove that file when the CMS is ready.

`docker compose down` stops the services without removing data. `docker compose down -v` deletes the local database, WordPress files, and media volumes. Do not use `-v` unless you intend to erase them.

## Content and Configuration

| Content / setting                                                                           | Source                                                      |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Portfolio item title, excerpt/body, tags, cover, gallery, video URL, credits, display order | WordPress `portfolio_item` and `portfolio_tag`              |
| About and Contact copy                                                                      | Published WordPress Pages with slugs `about` and `contact`  |
| Site name, description, contact email, social links                                         | WordPress **Settings → Portfolio site**                     |
| English/Spanish interface labels                                                            | `apps/web/messages/en.json` and `apps/web/messages/es.json` |
| Tailwind theme tokens and responsive utility compositions                                   | `apps/web/app/globals.css`                                  |
| CMS origin, canonical public origin, webhook secret                                         | Environment variables; see `.env.example` files             |

The app only requests public published WordPress content and the explicitly public site-settings endpoint. No WordPress admin credential belongs in Vercel or the browser. Page HTML is sanitized before rendering. When the CMS is unavailable, `apps/web/lib/site-config.ts` supplies generic preview defaults; replace the preview contact value before using the frontend without WordPress. Social links are empty until configured in WordPress.

## WordPress Content Model

The plugin registers a public REST-enabled `portfolio_item` custom post type and `portfolio_tag` taxonomy. Its REST routes are `/wp-json/wp/v2/portfolio_item` and `/wp-json/wp/v2/portfolio_tag`. Custom REST metadata is explicitly registered for `portfolio_cover_image_id`, `portfolio_gallery_image_ids`, `portfolio_video_url`, `portfolio_credits`, and `portfolio_display_order`; image fields store WordPress attachment IDs. Use the normal WordPress editor and media library. Give uploaded images meaningful alt text there.

The plugin also adds **Settings → Portfolio site** for brand values and exposes only those public values at `/wp-json/portfolio-studio/v1/settings`. Social links are entered one per line as `Label | https://example.com`; invalid URLs are discarded. The settings endpoint contains no credentials. Site setting changes, including the initial save, send a signed revalidation event.

Published item and About/Contact page status changes send a non-blocking, signed request to the frontend's `/api/revalidate` route. Configure the same `REVALIDATION_SECRET` on both services and set `NEXT_PUBLIC_SITE_URL` in WordPress to the public frontend URL. Portfolio events refresh Home, Portfolio, that item's detail page, and the sitemap. About/Contact events refresh their page. Settings events expire the site-config cache and refresh Home and Contact. The endpoint accepts only known event types and page slugs.

The portfolio filter is available on `/portfolio`; the `Video` taxonomy tag is treated like any other tag. A portfolio item with slug `videobook` is featured on Home when present, otherwise an item tagged `video` is featured. Individual work uses `/portfolio/[slug]` and is not promoted to a separate top-level route.

## Environment Variables

| Variable                     | Where                 | Purpose                                                                                                            |
| ---------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `CMS_URL`                    | `apps/web`            | Public WordPress origin, for example `https://cms.example.com`; server-side REST requests append `/wp-json/wp/v2`. |
| `NEXT_PUBLIC_SITE_URL`       | `apps/web`, WordPress | Canonical public frontend origin used for SEO and WordPress webhook delivery. Public, not a secret.                |
| `REVALIDATION_SECRET`        | `apps/web`, WordPress | Shared long random secret for signed publishing events. Keep private and identical on both services.               |
| `PORTFOLIO_WP_HOME`          | WordPress             | Canonical WordPress origin, for example `https://cms.example.com`.                                                 |
| `WORDPRESS_DB_HOST`          | WordPress             | Railway MySQL private host and port.                                                                               |
| `WORDPRESS_DB_NAME`          | WordPress             | MySQL database name.                                                                                               |
| `WORDPRESS_DB_USER`          | WordPress             | MySQL application user.                                                                                            |
| `WORDPRESS_DB_PASSWORD`      | WordPress             | MySQL application password; store as a Railway secret/reference.                                                   |
| `WORDPRESS_DB_ROOT_PASSWORD` | Local Docker only     | Local MariaDB root password; do not use this for Railway.                                                          |
| `WORDPRESS_PORT`             | Local Docker only     | Local WordPress port, default `8080`.                                                                              |

The root `.env.example`, `apps/web/.env.example`, and `apps/wordpress/.env.example` contain names and explanatory placeholders only. Never commit `.env`, `.env.local`, real credentials, or deployment values. Generate a shared production secret with `openssl rand -base64 32` and enter it directly in Railway and Vercel settings.

## Railway: WordPress and MySQL

1. Create a Railway account and project. Add a **MySQL** service; use the Railway-provided private connection values rather than exposing MySQL publicly.
2. Add this repository as a WordPress service. Set its root directory to `apps/wordpress`; Railway will build `Dockerfile` there. The image contains WordPress core from the upstream image plus only the tracked custom plugin.
3. Add a Railway persistent volume mounted at `/var/www/html/wp-content/uploads`. Do not mount over all of `wp-content`, or the plugin included in the image will be hidden. Attach the MySQL service and set `WORDPRESS_DB_HOST`, `WORDPRESS_DB_NAME`, `WORDPRESS_DB_USER`, and `WORDPRESS_DB_PASSWORD` using Railway's variable-reference picker.
4. Set the service's target port to `80`. Add a Railway-generated public domain first, then set `PORTFOLIO_WP_HOME` to that HTTPS origin. Set `NEXT_PUBLIC_SITE_URL` to the final public frontend URL and set `REVALIDATION_SECRET` to the same production secret used by Vercel.
5. Set `WORDPRESS_CONFIG_EXTRA` to the following PHP (Railway multiline variable):

   ```php
   define('WP_HOME', getenv('PORTFOLIO_WP_HOME'));
   define('WP_SITEURL', getenv('PORTFOLIO_WP_HOME'));
   if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strpos($_SERVER['HTTP_X_FORWARDED_PROTO'], 'https') !== false) { $_SERVER['HTTPS'] = 'on'; }
   ```

6. Deploy, open the WordPress domain, complete the installer, activate the plugin, and add the published pages/items. Keep the database private; the Next.js server reads public published REST responses over HTTPS.

Railway service names and generated database variable names depend on the project. Use its reference picker for the actual MySQL service instead of copying example credentials. Back up the MySQL database and uploads volume independently, keep off-platform copies, and periodically test restoring both together.

## Vercel: Next.js

1. Create a Vercel account and import the same Git repository.
2. Set **Root Directory** to `apps/web`. Keep the detected Next.js framework and default install/build commands (`npm install`, `npm run build`).
3. Add these Production and Preview environment variables: `CMS_URL` (the public Railway WordPress origin), `NEXT_PUBLIC_SITE_URL` (the intended public frontend origin), and `REVALIDATION_SECRET` (the same private value configured in Railway). Add the same variables to Development if using Vercel's local tooling.
4. Deploy. Add the production domain in Vercel's project settings. Vercel will show the exact DNS records for the selected domain and account; add those records at your registrar, remove conflicting records, and wait for Vercel to verify DNS and issue HTTPS.

`next.config.ts` allows optimized media from the hostname in `CMS_URL` plus the isolated Unsplash preview host. The plugin stores media on the WordPress origin by default. If media is served from a separate CDN/custom hostname, add that hostname to `remotePatterns` in `apps/web/next.config.ts` before deploying. Configure `CMS_URL` at build/deploy time so the image host is available to Next.js.

To add `cms.example.com`, add that custom domain to the Railway WordPress service and create the CNAME (or other record Railway specifies) at your DNS provider. Update `PORTFOLIO_WP_HOME` and `CMS_URL` to the new HTTPS CMS origin, then redeploy. Add `www.example.com` and/or the apex domain to Vercel and use the exact Vercel-provided A/CNAME records. Domain targets vary by account and DNS provider, so use the records shown in each service rather than a copied IP address.

## Publishing Flow

Create or update content in WordPress and publish it. The plugin sends a signed event; the frontend invalidates the affected route and fetches the updated public REST content on its next request. If webhook delivery is unavailable, use the protected endpoint manually:

```sh
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/revalidate" \
  -H "Authorization: Bearer $REVALIDATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"portfolio_item","slug":"your-item-slug"}'
```

Allowed page events are `{"type":"page","slug":"about"}` and `{"type":"page","slug":"contact"}`. To refresh brand settings, send `{"type":"site_settings"}`. Keep the secret out of shell history and source control when testing production.

## Checks

```sh
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

The project has no visitor authentication, ecommerce, blog, newsletter, or analytics integration. Analytics remains absent and disabled by default.
