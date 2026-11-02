# Page Image Alt Text

For About and Contact pages, the `rest_prepare_page` filter fills empty or
missing image alt attributes in `content.rendered` using the Media Library
attachment's Alternative Text (`_wp_attachment_image_alt`). This fixes saved
Image blocks whose alt text was left empty before the media description was
updated. Stored page content and the REST response schema are unchanged.

Images must have WordPress's `wp-image-ID` class and refer to an image attachment.
Nonempty page-specific alt text is preserved. Images with `role="presentation"`,
`role="none"`, or `aria-hidden="true"` are left untouched. An empty alt alone
uses the media fallback; explicitly mark decorative images when their attachment
has a description that should not be used in that context.

If the attachment's Alternative Text is also empty, the filter does not invent
a description from the filename, title, or caption. Add an accurate description
in WordPress. External images without an attachment ID are unchanged.

The frontend already preserves alt attributes during sanitization and rendering.
After deploying this plugin change or editing media alt text, republish About
and Contact to trigger their existing page cache invalidation. A frontend rebuild
alone may reuse cached page responses. No deployment or cache invalidation is
performed by adding this code.

## Verification

Run PHP lint on `page-image-alt.php`, `portfolio-studio.php`, and
`tests/page-image-alt-test.php`. Run the latter with the WordPress PHPUnit test
installation and this plugin loaded. Never run database-backed tests against
production. Tests cover both page slugs, missing/empty alt, escaped characters,
authored descriptions, explicitly decorative images, missing metadata, external
images, other pages, and responses without rendered content.
