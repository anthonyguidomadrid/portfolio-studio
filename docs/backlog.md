# Initial Backlog

Order is dependency-aware. Parallel notes identify tasks that may proceed simultaneously only after their shared prerequisites are met. Create a separate issue and branch/PR for each item.

The repository already contains the Next.js routes, CMS client, custom plugin/content model, filtering, settings endpoint, and revalidation path described below. Treat these as proposed audit/contract-hardening issues first: inspect the current implementation and close an item without code changes if its acceptance criteria already pass. Do not rebuild existing functionality just to follow this list.

## B01 — Repository foundation and checks

**Owner:** Coordinator / repository maintainer  
**Goal:** Verify the current repository baseline and keep instructions, package checks, ignore rules, and CI aligned with it.  
**Scope:** Audit root/app ignore rules and env examples; verify CI runs frontend typecheck, lint, and build without CMS credentials.  
**Acceptance criteria:** Architecture and commands match the repository; CI runs the three app checks for pull requests; no WordPress runtime data or secrets are tracked.  
**Verification:** `npm --prefix apps/web run typecheck`; `npm --prefix apps/web run lint`; `npm --prefix apps/web run build`; inspect `git status --short`.  
**Dependencies:** None.

## B02 — Agree and verify WordPress content contract

**Owner:** WordPress agent  
**Goal:** Audit and adopt the existing custom plugin/API as the agreed stable public REST contract.  
**Scope:** Verify post type, taxonomy, metadata types, media IDs, About/Contact slugs, public settings response, permissions, and publishing event payloads against the current plugin.  
**Acceptance criteria:** `docs/architecture.md` or a linked contract gives exact paths/fields; public GETs expose only published content and intended settings; writable fields are capability-protected and sanitized; representative responses match the frontend client's expectations.  
**Verification:** PHP syntax/runtime or Docker-based REST checks where available; otherwise identify checks unavailable and attach inspected payload/schema evidence.  
**Dependencies:** B01.  
**Parallel:** B04 can start after B01 because the shared frontend shell does not depend on CMS field details.

## B03 — Typed frontend CMS client

**Owner:** Frontend agent  
**Goal:** Audit and close contract gaps in the existing typed CMS and site-config clients.  
**Acceptance criteria:** Requests are server-side; published content needs no admin credential; malformed/missing fields are safely handled; CMS outages do not break build/preview; settings fields and image host behavior match the agreed contract. Implement only demonstrated gaps.  
**Verification:** Typecheck, lint, build without CMS env; fixture/manual integration check with a local WordPress instance when available.  
**Dependencies:** B02.  
**Parallel:** Can run with B04 after B02 is accepted, with disjoint files.

## B04 — Shared layout and design foundation

**Owner:** Frontend agent  
**Goal:** Audit the existing shared layout and verify its reuse and branding boundaries.  
**Acceptance criteria:** Home/About/Portfolio/Contact navigation works; Tailwind tokens preserve the monochrome/Montserrat/editorial direction; layout works on mobile and desktop; UI labels come from locale messages; no portfolio-specific identity is baked into shared components. Implement only demonstrated gaps.  
**Verification:** Typecheck, lint, build; manual keyboard and narrow viewport checks.  
**Dependencies:** B01.  
**Parallel:** May proceed alongside B02 and then B03 if agents own distinct files.

## B05 — CMS-backed Home, About, and Contact

**Owner:** Frontend agent  
**Goal:** Verify existing Home/About/Contact pages use editable CMS content and reusable site configuration correctly.  
**Acceptance criteria:** Home prominently shows the videobook item where available; About/Contact use WordPress Pages; settings come from WordPress with isolated preview fallback; metadata/canonical paths and missing-CMS states are correct. Implement only demonstrated gaps.  
**Verification:** Typecheck, lint, build; verify preview fallback and local CMS response.  
**Dependencies:** B03, B04.

## B06 — Portfolio listing and tag filtering

**Owner:** Frontend agent  
**Goal:** Verify and harden the existing portfolio listing and tag filter against the CMS taxonomy.  
**Acceptance criteria:** All-items and tag filters work by keyboard; empty result state is clear; cards link to detail routes; Video works as a tag; videobook stays an item rather than a top-level route. Implement only demonstrated gaps.  
**Verification:** Typecheck, lint, build; manual filter checks for Video, another tag, and no-match state.  
**Dependencies:** B03, B04.

## B07 — Portfolio item route and media presentation

**Owner:** Frontend agent  
**Goal:** Verify the existing detail route, gallery, video, credits, and not-found behavior against the CMS contract.  
**Acceptance criteria:** Image alternatives come from CMS media/copy; gallery controls are keyboard-accessible; video URLs are safely embedded or linked; optional fields fail gracefully; no invented credits appear. Implement only demonstrated gaps.  
**Verification:** Typecheck, lint, build; test one item with gallery/video and one with missing optional fields.  
**Dependencies:** B03, B04, B06.

## B08 — Publishing and cache revalidation

**Owner:** WordPress + Frontend agents, sequenced contract then integration  
**Goal:** Verify the existing signed publishing hooks and revalidation endpoint refresh the correct public routes.  
**Acceptance criteria:** WordPress sends signed events; frontend checks the shared secret safely, validates event type/slug, expires relevant tagged data and paths, and rejects malformed/unauthorized requests. Failure to deliver the webhook is documented and recoverable.  
**Verification:** Typecheck, lint, build; local authorized/unauthorized POST checks; WordPress publish/update check if runtime is available.  
**Dependencies:** B02, B03, B05, B06.  
**Parallel:** WordPress sender and frontend receiver may be implemented concurrently only after the payload contract is accepted and file ownership is disjoint.

## B09 — Deployment and launch checks

**Owner:** Repository maintainer with frontend/WordPress review  
**Goal:** Verify local-to-Railway/Vercel configuration without an agent deploying production.  
**Acceptance criteria:** Railway DB/uploads persistence, Vercel `apps/web` root, env variable names, media hostname, canonical URL, DNS checklist, backups, and restore procedure are documented; secrets remain outside Git; preview/prod CMS URLs are intentionally configured.  
**Verification:** CI checks; staging smoke checks and documented backup/restore test. Production deployment, DNS edits, and secret changes require explicit human action.  
**Dependencies:** B01–B08.  
**Parallel:** Documentation review can happen alongside staging preparation, but launch sign-off depends on all prior acceptance criteria.
