# 404 Background Image Settings Contract

## Editor Workflow and Permissions

In Settings > Portfolio site, choose or upload a single image with the
**Choose 404 background image** button, or clear it with **Remove 404 background
image**, then save changes. Uploads use the standard Media Library and its
`upload_files` capability. The page and writes require `manage_options`;
`options.php` enforces the existing Settings API nonce and capability checks.
There is no new public write route. Title, subtitle, and home-link text are not
CMS fields in this change.

The `portfolio_studio_site_settings` option stores
`not_found_background_image_id` as a nonnegative integer, default `0`. Invalid
IDs, non-image attachments, missing dimensions, and images with nonpublic or
password-protected parents are cleared on save. Removing the selection does
not delete the media file. No uploads or database contents are versioned.

## Public API Addition

`GET /wp-json/portfolio-studio/v1/settings` remains unauthenticated and read-only.
It adds `notFoundBackgroundImage`, always present, with this type:

```ts
type NotFoundBackgroundImage = {
  id: number;
  url: string;
  width: number;
  height: number;
} | null;
```

Illustrative response excerpt (all existing settings fields remain unchanged):

```json
{
  "notFoundBackgroundImage": {
    "id": 201,
    "url": "https://cms.example.com/wp-content/uploads/2026/10/background.jpg",
    "width": 1600,
    "height": 1000
  }
}
```

IDs and dimensions are positive integers. `url` is an HTTP(S) full-size image
URL under the configured WordPress uploads base URL. Offloaded/external image
URLs are not supported by this field. Only attachment statuses `inherit` and
`publish` are eligible. A parent, when present, must be published and not
password protected. Attachments themselves must not be password protected.
Eligibility is checked on every API read; unavailable, deleted, trashed, or
invalid selections produce `"notFoundBackgroundImage": null`, not an API error.
No attachment metadata or private parent information is returned.

## Frontend Handoff and Invalidation

The frontend owner must validate this optional addition, accept missing/null
values for compatibility with older CMS deployments, and retain a neutral
fallback when the image or CMS is unavailable. Render the image as decorative
with empty alternative text. No frontend files are changed here.

Selection changes reuse the existing signed `site_settings` event. Selected
attachment metadata/file changes, edits/deletion, and parent updates/deletion
queue the same event at shutdown (once per request), after writes finish.
Delivery remains best effort and uses the existing frontend URL/secret setup.
The frontend owner must ensure the custom 404 consumes the site-settings cache
and that settings invalidation refreshes its output; this backend change does
not assert that a 404 route or its cache integration already exists.

## Verification

```sh
node --check apps/wordpress/plugins/portfolio-studio/assets/portfolio-admin.js
node --test apps/wordpress/plugins/portfolio-studio/tests/portfolio-admin.test.cjs
php -l apps/wordpress/plugins/portfolio-studio/not-found-settings.php
php -l apps/wordpress/plugins/portfolio-studio/portfolio-studio.php
php -l apps/wordpress/plugins/portfolio-studio/tests/not-found-settings-test.php
```

Run `tests/not-found-settings-test.php` in a WordPress PHPUnit installation
with the plugin loaded before `init`. Never use a production test database.
Smoke-test choose/upload/replace/remove/save, anonymous settings reads, and
signed event delivery in a WordPress runtime. No deployment is included.