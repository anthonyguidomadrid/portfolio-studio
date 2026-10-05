# Portfolio Studio

A reusable headless portfolio starter with one public Next.js Home page that reads its site name from a WordPress settings endpoint. The Home page currently shows a Coming Soon message; the theme specimen is shown only in development. Add future public pages only when the product scope calls for them.

## Structure

- `apps/web`: Next.js App Router, TypeScript, Tailwind CSS v4, and the server-side WordPress settings client.
- `apps/wordpress`: custom plugin and Docker build context; WordPress core, database contents, uploads, and credentials stay out of Git.
- `docs/architecture.md`: frontend/CMS boundary and deployment environment overview.
- `apps/web/THEME.md`: theme tokens and utility usage.

## Local Development

1. Copy root `.env.example` to `.env` and set local database passwords and a revalidation secret.
2. Copy `apps/web/.env.example` to `apps/web/.env.local`. Set `CMS_URL=http://localhost:8080`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, and the matching `REVALIDATION_SECRET`.
3. Start local WordPress and MariaDB from the repository root:

   ```sh
   docker compose up -d --build
   ```

4. Open `http://localhost:8080`, complete the WordPress installer, and activate **Portfolio Studio Content**. Set the brand name in **Settings → Portfolio site**.
5. Start Next.js:

   ```sh
   npm --prefix apps/web run dev
   ```

   Open `http://localhost:3000`. The app requests the public settings endpoint at `/wp-json/portfolio-studio/v1/settings`. Without a reachable CMS it uses the generic preview name `Portfolio Studio` and logs the fallback.

`docker compose down` stops services without deleting data. `docker compose down -v` removes the local database, WordPress files, and uploaded media volumes.

## Theme and Brand

The design tokens and base styles are in `apps/web/app/globals.css`; the font is loaded with `next/font/google` in `apps/web/app/layout.tsx`. See [apps/web/THEME.md](apps/web/THEME.md) for semantic utility guidance and the dev-only theme preview. Change brand name, description, email, and social links in WordPress **Settings → Portfolio site**; `apps/web/lib/site-config.ts` is only the CMS-unavailable fallback.

## Checks

Run from the repository root:

```sh
npm --prefix apps/web run typecheck
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

## Deployment Notes

Deploy WordPress from `apps/wordpress` to Railway, with its database attached privately and a persistent volume mounted at `/var/www/html/wp-content/uploads`. Deploy Next.js to Vercel with `apps/web` as the project root. Set `CMS_URL`, `NEXT_PUBLIC_SITE_URL`, and `REVALIDATION_SECRET` as described in the example environment files; keep the revalidation secret private and identical in both services. See [docs/architecture.md](docs/architecture.md) for the API boundary and environment roles. Back up the database and uploads separately and test restores together.
