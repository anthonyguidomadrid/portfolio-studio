# WordPress Runtime

This directory is the Docker build context for the headless WordPress service. The [Dockerfile](Dockerfile) starts from the official WordPress PHP 8.3 Apache image, copies the custom plugin into the image, and uses [railway-entrypoint.sh](railway-entrypoint.sh) to ensure Apache uses `mpm_prefork` before starting WordPress.

The maintained custom code lives in [plugins/portfolio-studio](plugins/portfolio-studio/README.md). WordPress core, the database, uploaded media, and production secrets are runtime/deployment data; do not commit them.

## Local Compose

Run the services from the repository root, not this directory:

```sh
cp .env.example .env
docker compose up -d --build
```

The Compose file starts MariaDB and WordPress, waits for the database health check, exposes WordPress at `WORDPRESS_PORT` (default `8080`), and mounts the plugin source read-only. Named volumes hold MariaDB data, WordPress files, and uploaded media. `docker compose down -v` deletes these local volumes and all their contents.

After the WordPress installer is complete, activate **Portfolio Studio Content** in Plugins. Local WordPress settings are in `.env`; keep this file out of Git.

## Service Configuration

WordPress requires the official image database variables:

- `WORDPRESS_DB_HOST`
- `WORDPRESS_DB_NAME`
- `WORDPRESS_DB_USER`
- `WORDPRESS_DB_PASSWORD`

The custom plugin also reads:

- `NEXT_PUBLIC_SITE_URL`: public frontend origin. Despite the `NEXT_PUBLIC_` prefix, this is read by the WordPress server, not exposed to the browser. It is used for redirects and signed cache-revalidation requests.
- `REVALIDATION_SECRET`: private bearer secret shared with the frontend's `REVALIDATION_SECRET`. Never commit or expose it.
- `PORTFOLIO_WP_HOME`: local Compose helper used to set WordPress Home/Site URLs. In production, set the WordPress home and site URLs to the CMS domain, not the frontend domain.

Local values and database passwords are illustrated in the root [.env.example](../../.env.example). Production values must be configured by a human in the hosting provider's secret/environment settings.

## Railway Notes

Build the service with `apps/wordpress` as the build context. Attach a private MySQL-compatible database and configure the official WordPress DB variables. Mount persistent storage at `/var/www/html/wp-content/uploads`; without it, media uploads can be lost when the service is replaced. Do not set a custom Railway Start Command: the image entrypoint must run before `apache2-foreground`.

The CMS domain should serve the WordPress REST API and authenticated admin while public theme requests redirect to the frontend. The CMS virtual `robots.txt` blocks crawling except for `/wp-content/uploads/`, when the frontend URL is configured; this is a crawler directive, not access control. See the [headless routing guide](plugins/portfolio-studio/HEADLESS-ROUTING.md).

Back up the database and uploads independently, and test restoring them together. Deployment and secret/domain changes are operational actions; documentation and local code changes do not perform them.