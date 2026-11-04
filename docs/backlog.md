# Current Backlog

This list contains historical and remaining verification work. The product has since expanded beyond the original minimal Home-only baseline: Home, About, Contact, Portfolio, Videos, Legal, SEO metadata, optional Person JSON-LD, and the WordPress photo API are implemented. Verify current code and tests before opening an issue; close, update, or narrow tasks that describe already-shipped work.

One item equals one issue, branch, and PR. Only work on items with an owner, dependencies, acceptance criteria, and verification plan.

## B01 — Keep CI and tests reproducible

**Status:** Existing baseline; audit only for demonstrated gaps.
**Owner:** Frontend agent
**Scope:** Check npm 10 `npm ci`, Vitest, typecheck, lint, and production build in GitHub Actions. Preserve the Node engine and lockfile compatibility.
**Acceptance criteria:** CI runs `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`; the same sequence succeeds from a clean install; no CMS credentials are required.
**Verification:** Execute the listed commands with the CI Node/npm versions.
**Dependencies:** None.

## B02 — Verify the WordPress settings contract

**Status:** Endpoint and frontend client exist; verify end to end when WordPress runtime is available.
**Owner:** WordPress agent, with frontend contract review
**Scope:** Confirm `/wp-json/portfolio-studio/v1/settings` exposes `name`, `description`, `contactEmail`, the seven optional platform URL fields, optional 404 media, Home/default SEO data, and optional Person data; confirm the corresponding settings screens update them.
**Acceptance criteria:** An activated local plugin returns the documented public response; invalid platform URLs and media are discarded; Person is omitted until a name is configured and `sameAs` reuses configured public profile URLs; no private setting or credential is exposed; `getSiteConfig()` accepts the response and falls back safely when CMS is unavailable.
**Verification:** REST request against a local WordPress instance plus `npm --prefix apps/web run test`. If PHP/Docker are unavailable, report this as an unverified integration rather than claiming success.
**Dependencies:** B01.

## B03 — Exercise site-settings publishing revalidation

**Status:** Sender and receiver exist; end-to-end delivery needs runtime verification.
**Owner:** WordPress and frontend agents, sequenced by the existing event contract
**Scope:** Verify that saving WordPress site settings sends the signed `site_settings` event and that the frontend revalidates the Home route and cached settings.
**Acceptance criteria:** Missing/wrong secrets are rejected; the valid event expires `site-settings` and refreshes `/`; a settings change appears on a subsequent Home request; failure behavior is documented.
**Verification:** Unit or route test for authorization/event handling plus a local WordPress-to-Next smoke test where runtime services are available.
**Dependencies:** B02.
**Parallel:** Sender/receiver test work may be separate only if file ownership does not overlap; coordinate contract or shared test files first.

## B04 — Deployment readiness and backup verification

**Status:** Deployment instructions exist; no deployment is implied.
**Owner:** Repository maintainer with frontend/WordPress review
**Scope:** Review Railway MySQL and uploads persistence, Vercel root directory `apps/web`, required env names, canonical URLs, DNS instructions, and recovery steps.
**Acceptance criteria:** Docs match current app behavior and CMS contract; staging values are configured by a human; database and upload backups are tested together; no production domains, secrets, or deploy changes are performed by agents.
**Verification:** Staging smoke checks and a documented restore test; CI checks from B01.
**Dependencies:** B01–B03.

## B05 — Review future public product scope

**Status:** Original scope decision is superseded by the shipped routes. Use only for additional future scope.
**Owner:** Product owner
**Scope:** Decide whether to add further routes/content types, localization, or other public features beyond the existing routes and portfolio gallery.
**Acceptance criteria:** The product owner names new desired routes/content and priorities. The coordinator creates focused feature issues and identifies CMS contract dependencies.
**Verification:** Written scope decision and a coordinator-produced dependency plan.
**Dependencies:** None; do not start implementation before approval.

## Parallelism and ownership

B02 contract/runtime verification and B01 CI audit can happen in parallel if they touch disjoint files. B03 depends on B02's verified event contract. B04 depends on CI and CMS checks. B05 is a product decision and may happen at any time, but implementation it authorizes is separately scoped. Never have two agents edit the same file concurrently.
