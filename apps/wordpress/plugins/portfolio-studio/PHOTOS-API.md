# Portfolio Photo Contract

One published `portfolio_item` represents one photograph. Assign **Portfolio
tags** and set **Display order** in the existing editor. The collection uses the
custom **Cover image** when selected, otherwise it falls back to the WordPress
**Featured image**. Lower orders appear first; ties use natural case-insensitive
title order, then ascending item ID. Missing order metadata is treated as zero.
Existing gallery, video, and credits fields are retained but not used by this
collection.

## Public Read

`GET /wp-json/portfolio-studio/v1/photos`

No authentication is required. This route never accepts writes. Existing standard
WordPress item/media/tag REST routes remain unchanged. Item and metadata writes
require WordPress authentication and edit capabilities; the existing admin save
handler requires its nonce and `edit_post` capability. Registered meta now also
has the custom-fields post-type support required by WordPress REST persistence.

Parameters:

- `page`: integer >= 1, default 1.
- `per_page`: integer 1-100, default 24.
- `tag`: optional string <= 200 characters, sanitized as a slug. Matches a
  `portfolio_tag` slug; unknown tags produce an empty collection. Omitting `tag`
  or providing an empty or whitespace-only value returns all eligible photos.
  `tag=all` matches the literal `all` tag; it is not an unfiltered alias.

Items are published, non-password-protected posts with a valid image cover and
positive image dimensions. Draft/private/trashed items and missing images are
omitted. Attachments belonging to a different nonpublic/password-protected parent
are also omitted. Filtering occurs before pagination. `tags` is the union of tags
on all eligible photos, not just the selected page or tag, sorted by name/ID.

Example response (illustrative data, not seeded content):

```json
{
  "items": [
    {
      "id": 101,
      "slug": "example-photo",
      "title": "Example photo",
      "displayOrder": 0,
      "image": {
        "id": 201,
        "url": "https://cms.example.test/wp-content/uploads/example.jpg",
        "width": 800,
        "height": 1000,
        "alt": "Example descriptive alternative",
        "caption": ""
      },
      "tags": [{ "id": 5, "slug": "editorial", "name": "Editorial" }]
    }
  ],
  "tags": [{ "id": 5, "slug": "editorial", "name": "Editorial" }],
  "total": 1,
  "totalPages": 1,
  "page": 1
}
```

All IDs/order/dimensions/counts are integers; titles, captions, alt text, names,
slugs and URLs are strings. Caption/title/alt are plain text. Missing caption/alt
remain empty; no descriptive content is invented. Both `items` and `tags` are
arrays. Empty collections return page 1 with `total: 0`, `totalPages: 0`.
`X-WP-Total` and `X-WP-TotalPages` duplicate those counts in response headers.
Invalid arguments or pages beyond the collection return HTTP 400; taxonomy
retrieval failure returns HTTP 503. Fetch every page before client-side filtering,
or send `tag` on every paginated request for server-side filtering.

The implementation resolves eligible photos before slicing, to keep counts and
tag choices correct even with missing legacy order metadata or broken covers.
This is intended for a modest curated gallery; large collections will require
database-level indexing/pagination rather than scanning all published items.

## Invalidation Handoff

The plugin queues one event per request and sends it at shutdown, after post,
metadata, and taxonomy writes finish:

```json
{ "type": "portfolio_item", "slug": "" }
```

Delivery uses `POST <NEXT_PUBLIC_SITE_URL>/api/revalidate` with
`Authorization: Bearer <REVALIDATION_SECRET>`, JSON content type, TLS validation,
no redirects, and a three-second timeout. This is a collection-wide event; the
empty slug is intentional and must not be interpreted as an item path.

Triggers include publishing/editing/unpublishing an item, cover/order changes,
tag assignment/rename/deletion, attachment edit/metadata changes, and deletion of
items/attachments. Delivery is best effort, without a persistent retry queue;
frontend time-based revalidation is still needed. Media hooks deliberately
invalidate broadly to avoid missing shared cover updates.

The current frontend receiver does not yet accept `portfolio_item` events. The
frontend owner must add support that invalidates the photo collection cache tag
and `/portfolio`, preserving existing secret validation. No frontend change or
deployment is included here.

## Verification

PHP syntax: `php -l portfolio-studio.php` and `php -l portfolio-photos.php`.
The WordPress PHPUnit suite in `tests/photos-rest-test.php` requires a standard
WordPress test database/bootstrap with this plugin loaded before `init` and REST
route registration. Run that test through the installation's PHPUnit runner.
It does not run against production and must not be used with production data.
It checks visibility, missing covers/order metadata, stable ordering, image
fields, tag filtering before pagination, argument validation, and empty results.
An activated WordPress runtime is still required to smoke-test editor writes and
actual signed HTTP delivery to a frontend receiver.
