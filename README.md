# Portfolio Studio

A reusable headless portfolio built with a Next.js frontend and a self-hosted WordPress CMS. The frontend renders Home, About, Contact, Portfolio, Videos, and Legal routes; WordPress supplies public settings and editorial page content, and the custom plugin provides the curated portfolio photo API.

## Repository Guide

- [Frontend README](apps/web/README.md): routes, local setup, environment variables, caching, SEO, testing, and Vercel configuration.
- [WordPress runtime README](apps/wordpress/README.md): container build, required runtime configuration, storage, and Railway notes.
- [WordPress plugin README](apps/wordpress/plugins/portfolio-studio/README.md): installation, editor workflows, API summary, and backend checks.
- [Architecture](docs/architecture.md): service boundaries, data flow, caching, and deployment responsibilities.
- [Agent workflow](docs/agent-workflow.md): ownership, contract coordination, review, and handoff expectations.
- [Theme guide](apps/web/THEME.md): design tokens and utility conventions.
- [Consent setup](docs/consent-setup.md): Analytics and YouTube consent behavior and operator configuration.

## Local Development

Prerequisites: Node.js `>=22.13.0`, npm, and Docker Compose.

1. Copy `.env.example` to `.env`. Replace the local database passwords and webhook secret; keep these local-only values out of Git.
2. Copy `apps/web/.env.example` to `apps/web/.env.local`. Set `CMS_URL=http://localhost:8080`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, and the same `REVALIDATION_SECRET` used by the root `.env`.
3. Start WordPress and MariaDB from the repository root:

   ```sh
   docker compose up -d --build
   ```

4. Open `http://localhost:8080`, complete the WordPress installer, and activate **Portfolio Studio Content** under Plugins.
5. Configure the site name, description, email, and social profile URLs in **Settings → Portfolio site**. Configure Home SEO, the default sharing image, and optional Person data in **Settings → Portfolio SEO**. Create and publish CMS Pages using the supported slugs listed in the frontend README.
6. Start Next.js:

   ```sh
   npm --prefix apps/web run dev
   ```

   Open `http://localhost:3000`.

The compose file mounts the custom plugin read-only into WordPress and stores the database, WordPress files, and uploads in named volumes. `docker compose down` stops services and keeps data. `docker compose down -v` permanently removes those local volumes.

Without a reachable WordPress CMS, the frontend uses generic preview settings. Production metadata URLs require `NEXT_PUBLIC_SITE_URL` to be set correctly in the frontend host's **build environment**; otherwise URL generation falls back to localhost.

## Verification

Run the frontend checks from any directory through npm's prefix option:

```sh
npm --prefix apps/web test
npm --prefix apps/web run typecheck
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

These frontend checks do not require a live CMS. WordPress integration tests require a WordPress PHPUnit test installation and a test database; never run database-backed tests against production. The plugin also has standalone Node tests for its media picker. See the plugin README for exact commands.

## Deployment Summary

Deploy `apps/web` to Vercel with that directory as the project root. Deploy `apps/wordpress` to Railway with a private database connection and persistent storage for `/var/www/html/wp-content/uploads`. Set `CMS_URL`, `NEXT_PUBLIC_SITE_URL`, and `REVALIDATION_SECRET` in the appropriate services; the secret must match and remain private. Set `NEXT_PUBLIC_SITE_URL` before building the frontend because it is used for canonicals, sitemap, robots, and JSON-LD URLs. Keep Railway's custom Start Command unset so the image entrypoint can configure Apache and start WordPress.

WordPress-to-frontend cache invalidation is authenticated but best-effort. Verify production REST access, media URLs, SEO tags, JSON-LD, robots.txt, sitemap, and revalidation after a human-approved deployment. No deployment, production domain change, or secret change is performed by these instructions. Back up the WordPress database and uploads separately, and test restoring them together.
