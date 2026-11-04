# Frontend

The public site is a Next.js App Router application using TypeScript, React, and Tailwind CSS v4. WordPress requests are made server-side; WordPress credentials are never sent to the browser. The WordPress-unavailable path uses generic preview settings.

## Routes

- `/`: Home hero and site settings from WordPress.
- `/about`, `/contact`, `/videos`, `/legal`: sanitized published WordPress page content.
- `/portfolio`: WordPress portfolio page content plus the paginated, tag-filterable photo gallery. There are no `/portfolio/[slug]` detail pages.
- `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, icons, and `/api/revalidate`: technical endpoints.
- `/dev/theme-preview`: development-only theme token preview.

WordPress page slugs used by the frontend are `about`, `contact`, `portfolio`, `videos`, and `legal`. Missing pages show an unavailable state; the site falls back to localized route titles.

## Setup

Use Node.js `>=22.13.0`. From the repository root, copy `apps/web/.env.example` to `apps/web/.env.local` and set:

```dotenv
CMS_URL=http://localhost:8080
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REVALIDATION_SECRET=the-same-local-secret-as-the-wordpress-service
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

`CMS_URL` is the WordPress origin. `NEXT_PUBLIC_SITE_URL` is the public frontend origin and is used at build time for canonical, Open Graph, sitemap, robots, and JSON-LD URLs. Set it before a production build; absent or invalid values currently fall back to `http://localhost:3000`. `REVALIDATION_SECRET` must match the WordPress runtime secret and must never be exposed as a `NEXT_PUBLIC_` value. The GA4 measurement ID is public, optional, and analytics collection also requires user consent; see [consent setup](../../docs/consent-setup.md).

Install and run from this directory:

```sh
npm ci
npm run dev
```

Or run from the monorepo root:

```sh
npm --prefix apps/web ci
npm --prefix apps/web run dev
```

For local WordPress services and first-time CMS setup, use the [root README](../../README.md).

## WordPress Data and Caching

The frontend reads `/wp-json/portfolio-studio/v1/settings`, `/wp-json/portfolio-studio/v1/photos`, and published pages from `/wp-json/wp/v2/pages`. Page HTML is sanitized before rendering. REST strings, image URLs, SEO fields, and social links are validated before use.

CMS fetches use Next.js cache tags and indefinite data caching. A production rebuild alone may reuse existing data cache. WordPress sends authenticated events to `/api/revalidate` after relevant changes; delivery is best-effort, so verify updates if a webhook fails. Supported events are `site_settings`, `page` for `about`, `contact`, `portfolio`, `videos`, or `legal`, and `portfolio_item` with an empty slug for the collection. The receiver uses `REVALIDATION_SECRET` and does not follow redirects.

## SEO and Structured Data

`generateMetadata()` uses page SEO overrides, then WordPress page/site defaults. Canonical and Open Graph URLs are constructed from `NEXT_PUBLIC_SITE_URL`; social preview images use validated page images or the default SEO image.

The server renders Schema.org JSON-LD for `WebSite` and the current page. When WordPress provides a valid `seo.person` object with a name, the site graph also includes `Person`, using `jobTitle`, the configured portrait, and existing public social URLs as `sameAs`. About uses `ProfilePage` and references that Person; Contact uses `ContactPage`, and Portfolio uses `CollectionPage`. JSON-LD serialization escapes script-sensitive characters. Structured data describes configured facts only and does not imply rich-result eligibility.

Frontend `/robots.txt` allows public routes, disallows `/api/`, and references the frontend sitemap. WordPress serves a separate CMS-domain robots.txt that blocks CMS crawling except for `/wp-content/uploads/` when headless routing is configured. Robots rules guide crawlers; they do not protect private content or replace authentication.

WordPress editors manage these values in **Settings → Portfolio SEO** and the SEO meta box on supported Pages. See the [WordPress SEO contract](../wordpress/plugins/portfolio-studio/SEO-API.md).

## Commands

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

Vitest uses mocks and does not require WordPress. Integration checks for JSON-LD, metadata, REST normalization, sanitization, and fallback rendering live under `tests/`. The build may warn that both root and frontend lockfiles are detected; the selected workspace root does not prevent the build from succeeding.

Theme tokens and utility guidance are in [THEME.md](THEME.md). The root [architecture guide](../../docs/architecture.md) documents system boundaries and deployment.