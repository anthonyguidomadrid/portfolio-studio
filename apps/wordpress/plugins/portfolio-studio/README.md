# Portfolio Studio Content Plugin

This custom plugin provides the headless WordPress side of Portfolio Studio. It contains the public settings and portfolio photo APIs, SEO settings and page fields, public image validation, frontend cache-revalidation hooks, and headless theme routing. WordPress core, database contents, uploads, and credentials are runtime data and must not be committed.

## Install and Activate

For local development, start the repository's Docker Compose services from the root. Compose mounts this plugin into WordPress at `/var/www/html/wp-content/plugins/portfolio-studio` as read-only, so source edits are visible without copying them into the container. Complete the WordPress installer at `http://localhost:8080`, then activate **Portfolio Studio Content** under Plugins.

For deployment, build the image from `apps/wordpress`. The Dockerfile copies this plugin into the official WordPress image. On Railway, attach MySQL privately and a persistent volume for `/var/www/html/wp-content/uploads`. Leave the custom Start Command unset so `railway-entrypoint.sh` can configure Apache before calling the official WordPress entrypoint.

The plugin has no standalone package manager. PHP integration tests require a WordPress PHPUnit test installation and a dedicated test database; never run them against production.

## Editor Workflows

- **Settings → Portfolio site:** site name, description, contact email, home YouTube video/start time, social profile URLs, and the optional 404 background image.
- **Settings → Portfolio SEO:** Home SEO title/description/sharing image, default sharing image, and the optional Person profile (name, approved description, occupation, portrait, and portrait alt). Existing social profile URLs are reused as `sameAs`; they are not entered twice. Person data is omitted from public output until a name is configured.
- **Pages:** create and publish `about`, `contact`, `portfolio`, `videos`, and `legal`. The **SEO and sharing** meta box provides page title/description overrides and sharing image/alt. Empty page-image alt can fall back to the Media Library Alternative Text for About and Contact.
- **Portfolio items:** publish one `portfolio_item` per photo, assign Portfolio tags, choose a cover (or use Featured image), and set Display order. Keep the image alt text descriptive in the Media Library. The gallery does not expose item detail routes.

WordPress core authentication and capabilities protect editor writes. The custom settings and photo routes are anonymous read-only APIs; standard WordPress page/meta writes require authentication and edit capability. Robots directives are advisory, not access control. See [headless routing and robots](HEADLESS-ROUTING.md) for CMS-domain redirects and crawler rules.

## Public APIs

- `GET /wp-json/portfolio-studio/v1/settings`: site settings, optional 404 image, Home SEO/default sharing image, and optional Person profile.
- `GET /wp-json/portfolio-studio/v1/photos`: public curated photo collection with pagination and optional tag filtering. Contract: [PHOTOS-API.md](PHOTOS-API.md).
- `GET /wp-json/wp/v2/pages?slug=<slug>&_fields=slug,title,content,seo`: WordPress page content and a public, validated SEO object.
- Standard WordPress page, media, and taxonomy read APIs remain available according to WordPress core behavior. SEO meta writes require authenticated edit capability.

Detailed contracts: [SEO and Person fields](SEO-API.md), [page image alt behavior](PAGE-IMAGE-ALT.md), and [404 background settings](NOT-FOUND-SETTINGS.md).

## Environment and Revalidation

The plugin reads WordPress runtime environment variables:

- `NEXT_PUBLIC_SITE_URL`: public frontend origin. Used as the destination for headless redirects and the cache-revalidation endpoint.
- `REVALIDATION_SECRET`: private bearer secret shared with the frontend's API route. Keep identical on both services and never expose it in browser settings.

Relevant WordPress database environment values and local-only examples are in the root `.env.example` and `docker-compose.yml`. Do not copy real production secrets into tracked files.

The plugin sends authenticated `POST <NEXT_PUBLIC_SITE_URL>/api/revalidate` events for settings, supported pages, and portfolio photo collection changes. The frontend accepts `site_settings`, `page`, and `portfolio_item` events. Delivery is best-effort, without a persistent retry queue; inspect the published frontend if a content change does not appear. A frontend rebuild alone may reuse cached REST data.

## Checks

Run the standalone picker test and syntax check from the repository root:

```sh
node --check apps/wordpress/plugins/portfolio-studio/assets/seo-admin.js
node --check apps/wordpress/plugins/portfolio-studio/assets/portfolio-admin.js
node --test apps/wordpress/plugins/portfolio-studio/tests/seo-admin.test.cjs
node --test apps/wordpress/plugins/portfolio-studio/tests/portfolio-admin.test.cjs
```

PHP lint and the `*-test.php` integration tests require PHP and a WordPress PHPUnit environment. Example lint commands:

```sh
php -l apps/wordpress/plugins/portfolio-studio/portfolio-studio.php
php -l apps/wordpress/plugins/portfolio-studio/seo.php
php -l apps/wordpress/plugins/portfolio-studio/portfolio-photos.php
```

Never point WordPress PHPUnit or local database operations at production. Production deployment, domain configuration, secrets, and content updates require explicit human operation.
