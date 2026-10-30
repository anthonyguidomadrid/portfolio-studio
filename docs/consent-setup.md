# Consent Setup

## Public Analytics ID

`NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TENRH5WP8L` is a public GA4 measurement ID, not a secret. The root `.env.example` documents it, but Next.js reads local frontend settings from `apps/web/.env.local`. Add that line there for local analytics testing; leave it unset or empty to disable analytics entirely. Invalid IDs also do nothing. Never put admin credentials or other secrets in `NEXT_PUBLIC_` variables.

Set the same variable in the frontend host's environment **before building**. Next.js embeds the literal `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID` at build time. Restart local development after changing it; host changes require a new build. No hosting or deployment changes are performed by this implementation.

## Integration Contract

The root layout renders `Analytics` inside `ConsentProvider` and a React `Suspense` boundary. It uses Next.js pathname/search hooks and renders no UI. Consent logic, preference UI, and service integrations are separate frontend modules, independent of WordPress.

The provider's `useConsent()` returns `ready`, `choices` (`analytics`, `youtube`), `record`, `savePreferences`, `openSettings`, `closeSettings`, `settingsOpen`, and `storageError`. Both optional choices default off. Keep `ready=false` until the browser's persisted record has been read and validated, including on initial hydration. Analytics loads only when `ready && choices.analytics`.

The localStorage key is `portfolio-studio:consent`. Its versioned record contains `version: 1`, an ISO `timestamp`, and boolean `analytics` and `youtube` choices. Records expire after six **calendar** months in UTC, preserving the time and clamping the day to the destination month's last day (August 31 becomes February 28 or 29), not after a fixed day count. Invalid, outdated-version, future-dated, or expired records are treated as both options off. Expiry is enforced in open tabs and storage changes propagate across tabs. When storage is blocked, explicit choices apply in memory for the current visit and a notice explains that they cannot be remembered. Settings are available in the footer; closing or pressing Escape without saving preserves previous choices. Bump the version if changed purposes require renewed permission.

The provider calls `disableAnalytics()` synchronously on every save with `analytics:false`, invalid or expired storage, and cross-tab withdrawal. The component also disables Analytics when it sees unready or declined state. Withdrawing YouTube removes all consent-managed players.

## GA4 Behavior

No Google script or analytics commands are created before consent. After acceptance, the owned async `gtag/js` script loads, initializes once per browser document, and configures `send_page_view:false`, `allow_google_signals:false`, and `allow_ad_personalization_signals:false`. One manual `page_view` is sent initially and for each subsequent pathname or query-string change; hash-only changes and repeated renders do not create views. Navigations while the script loads are held locally and discarded on withdrawal. Page locations exclude the hash. Query strings are included, so the operator must keep personal or sensitive data out of URLs.

In GA4's web data stream, disable Enhanced Measurement page views based on browser-history changes (and any other automatic page-view setup or duplicate tags). `send_page_view:false` disables this integration's configuration-time view, not separately configured automatic history tracking. Review other automatic collection features in the property as well. This integration is intended to be the only GA loader on the page.

Withdrawal immediately sets `window['ga-disable-G-TENRH5WP8L']=true` (using the configured ID), blocks further commands from this integration, removes its script and load handlers, discards pending views, and clears its queued dataLayer commands without deleting unrelated entries. Late script callbacks cannot initialize or replay withdrawn events. Reacceptance permits tracking again without repeating a completed configuration. The loaded Google runtime cannot be unloaded, and requests already sent or in flight cannot be recalled. No reload is required or triggered; the disable flag and event gating are the chosen withdrawal mechanism.

Withdrawal also attempts to expire controllable first-party `_ga`, `_ga_*`, `_gid`, and `_gat*` cookies on the current hostname and parent-domain variants, at `/` and current-path ancestor variants. Unrelated cookies are left alone. Browser cookie restrictions, HttpOnly cookies, inaccessible sibling paths, and cookies on other origins cannot be controlled here. No Google-domain cookies are accessed or removed.

## Local Video Covers

The embed implementation displays local covers before YouTube consent, with `/video-covers/default.svg` as the generic local fallback. CMS YouTube iframes use shared consent. By explicit operator choice, the Home YouTube background is exempt: it loads after hydration without consent, uses muted looping autoplay on `youtube-nocookie.com`, and is disabled for reduced motion. Rejecting or withdrawing YouTube consent does not stop that background. A fresh Home visit can therefore contact YouTube before consent. Replace it with a locally hosted video when available and ensure the WordPress legal notice reflects this exception. CMS frame titles and width/height aspect ratios are retained (16:9 when dimensions are absent). YouTube-hosted CMS thumbnail images are removed before rendering. Accepted players use `youtube-nocookie.com`.

Place approved local covers in `apps/web/public/video-covers/`. Customize `LOCAL_VIDEO_COVERS` in `apps/web/lib/youtube.ts` with video IDs mapped to local paths such as `/video-covers/film.jpg`. Keep entries local: never fetch YouTube thumbnails, preload embeds, or add third-party preconnects before consent. Allow YouTube and play changes YouTube permission only, preserving Analytics. Watch on YouTube is an ordinary external link.

## Operator Review

Create and publish a WordPress page with slug `legal`, including its heading and legal notice in the page content. The frontend `/legal` route renders that sanitized content and uses the WordPress title for metadata; it shows the standard unavailable state if no published page exists. There is no hardcoded frontend legal notice. The route uses the existing hourly CMS cache and `wp-page-legal` cache tag; frontend revalidation accepts the `legal` slug, but WordPress publishing-hook coverage is unchanged. Before production use, complete controller identity/contact details, purposes and processing grounds, actual retention, transfers, rights, and jurisdiction-specific requirements. Keep the notice synchronized with the configured GA property, data collected, cookie behavior, expiry, and withdrawal limitations. These technical defaults provide no legal compliance guarantees.

Verify hydration gating, persistence, invalid/expired records, cross-tab withdrawal, analytics acceptance and reacceptance, and local-only declined video covers in the integrated browser experience. Automated analytics tests use jsdom, mocked consent/navigation, and simulated script loads; they do not contact Google or prove production GA property settings. No WordPress schema, WordPress files, production domains, credentials, or deployment actions are changed here.

## Browser Verification (2026-10-28)

These results predate the operator-requested Home background exemption. No-YouTube-before-consent and withdrawal results apply only to consent-managed content embeds, not the Home background.

Using a local production preview and temporary local CMS video fixture:

- Fresh visits and rejection: no Analytics or YouTube network resources or players.
- Analytics only: GA script requested, YouTube remained blocked.
- YouTube only: nocookie player loaded, no Analytics resources after reload.
- Preferences persisted across reloads. Withdrawal removed players, removed accessible GA cookies, and set the GA disable flag. Subsequent navigation with both declined produced no optional requests.
- With the public ID explicitly empty, acceptance and persistence worked without any Analytics script or requests.
- Mobile dialog fit a 390px viewport without horizontal overflow; native focus containment, Escape, and return to the banner opener were verified.
- The app queued one manual page view per route, but the supplied live GA stream also emitted automatic history page views. Disable history-based page views in GA4 Enhanced Measurement before production; end-to-end duplicate-free delivery is not verified until that setting is corrected.
- Collection requests were attempted, but successful receipt in GA reporting was not verified. These browser checks do not establish legal compliance.
