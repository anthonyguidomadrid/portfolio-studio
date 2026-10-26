# Headless WordPress Routing

Set the existing WordPress runtime environment variable `NEXT_PUBLIC_SITE_URL`
to the public frontend base URL, for example `https://portfolio.example.com`.
The plugin redirects theme-rendered requests with HTTP 302 before WordPress
canonical, feed, and sitemap handlers run. No theme changes are required.

Published WordPress Pages with slugs `about`, `contact`, `cv`, `portfolio`, and
`videos` redirect to the corresponding frontend path. The front page and other
theme requests, including archives, attachment pages, missing pages, feeds, and
WordPress sitemaps, redirect to the frontend homepage. Incoming query parameters
are not forwarded. Redirects send no-cache and `X-Robots-Tag: noindex, nofollow`
headers. They intentionally remain temporary while the mapping is verified.

The REST API (both `/wp-json/...` and `?rest_route=...`), admin, login, AJAX,
cron, and uploaded files are unchanged. These do not render public templates;
the handler also explicitly excludes REST, admin, AJAX, and cron contexts.
API routes, public response fields, authentication, and write permissions have
not changed. This policy is not authentication or protection for private data.

WordPress's virtual `robots.txt` stays accessible and disallows all crawling
when the frontend URL is configured. A physical robots file or proxy rule can
override it. Also enable Settings > Reading > Discourage search engines from
indexing this site. Robots directives are advisory, not access controls.

Missing or invalid frontend configuration leaves existing WordPress behavior
unchanged. URLs containing credentials, query parameters, or fragments are not
accepted. A destination using the same hostname as the WordPress home or site
URL is rejected to avoid redirect loops. The URL must pass WordPress's HTTP URL
validator; local/private destinations may be rejected. Removing the environment
variable and restarting the runtime disables the policy. Do not change the
WordPress home/site addresses to the frontend domain.

## Verification

Run PHP lint on `headless-routing.php`, `portfolio-studio.php`, and
`tests/headless-routing-test.php`. Run `tests/headless-routing-test.php` using a
WordPress PHPUnit test installation with this plugin loaded before `init`.
Never run database-backed tests against production.

After an explicitly authorized deployment, check root and known-page Location
headers, feed and sitemap redirects, `/robots.txt`, admin/login, both REST URL
forms, and a real uploaded image. Confirm the frontend still loads CMS content
and images. No production configuration or deployment is performed by adding
this code.
