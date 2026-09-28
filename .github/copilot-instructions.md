# Portfolio Studio Copilot Instructions

## Project shape

- This is a reusable headless portfolio, not a single-person portfolio implementation. Keep branding and portfolio content data-driven so the same app can serve a creative portfolio or a software engineering portfolio.
- `apps/web` is the Next.js App Router frontend written in TypeScript. It uses Tailwind CSS v4, `next-intl` (English/Spanish), and server-side WordPress REST requests.
- `apps/wordpress/plugins/portfolio-studio` contains the only custom WordPress code maintained here. WordPress core, database data, uploads, credentials, and generated output must not be committed.
- `docs/architecture.md` is the current system boundary reference. `docs/agent-workflow.md` describes issue, branch, review, and integration expectations.

## Ownership boundaries

- Frontend agent: `apps/web/**`, except do not redefine CMS schemas or WordPress behavior without agreement in the content contract.
- WordPress agent: `apps/wordpress/**`; document REST fields and response changes so the frontend can integrate against an explicit contract.
- Shared contract changes must be coordinated before concurrent frontend/CMS implementation. Do not let two agents edit the same file concurrently.
- Coordinator decomposes work, identifies dependencies, assigns a focused agent, and checks integration risks. It does not implement broad product changes.
- Reviewer is read-only for implementation and reports findings with file paths, impact, and verification gaps.

## Coding conventions

- Inspect the current implementation, relevant instructions, and worktree before editing. Preserve user changes and avoid unrelated refactors.
- Follow existing TypeScript/React patterns, strict typing, and App Router server/client boundaries. Keep secrets server-side; the browser may receive only public published content and public settings.
- Use Tailwind utilities and the existing Tailwind theme in `apps/web/app/globals.css`. Keep CSS additions limited to tokens, complex selectors, and cases utilities cannot express; do not restore a large handwritten component stylesheet.
- Put interface labels and accessibility text in `apps/web/messages/{locale}.json`; do not add new hardcoded UI strings to components. WordPress owns editable portfolio/page copy and brand values.
- Keep reusable brand settings sourced through the WordPress site-settings REST endpoint; `apps/web/lib/site-config.ts` is only the CMS-unavailable preview fallback.
- Sanitize editable rich content, validate untrusted REST values, provide useful empty/error states, and keep preview content isolated from production CMS data.
- Use semantic HTML, descriptive image alternatives, keyboard-operable controls, responsive layouts, and reduced-motion-aware behavior.
- Do not add real portfolio photography, private content, visitor authentication, analytics, ecommerce, blog/newsletter features, secrets, or deployment actions without an explicit request.

## Verification

Run from the repository root:

```sh
npm --prefix apps/web run typecheck
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

Run the checks relevant to every changed slice and report only checks actually run. The build uses isolated preview data when `CMS_URL` is absent. PHP lint/Docker checks may be unavailable locally; state that rather than claiming they passed. Never claim Railway or Vercel deployment succeeded unless it was performed and verified.

## Agent handoff report

Every implementation or review handoff states: changed files, checks actually run and their results, unresolved risks, assumptions, and any CMS/deployment impact.
