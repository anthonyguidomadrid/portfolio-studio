import { getSiteConfig } from "@/lib/site-config";
import { ThemePreview } from "@/components/theme-preview";

export default async function HomePage() {
  const siteConfig = await getSiteConfig();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-content flex-col px-page-gutter">
      <header className="flex items-center justify-between border-b border-border py-5 text-small">
        <p className="m-0 font-semibold uppercase text-foreground">
          {siteConfig.name}
        </p>
      </header>

      <section
        className="grid flex-1 content-center gap-section py-section md:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)] md:items-end"
        aria-labelledby="profile-title"
      >
        <div>
          <p className="mb-5 text-small font-medium uppercase tracking-wide text-muted-foreground">
            Portfolio
          </p>
          <h1 id="profile-title" className="max-w-[12ch] text-heading-1">
            {siteConfig.name}
          </h1>
          <p className="mt-7 max-w-prose text-heading-3 font-normal normal-case text-muted-foreground">
            {siteConfig.description}
          </p>
          <p className="mt-6 text-small font-medium uppercase tracking-wide text-muted-foreground">
            Coming soon.
          </p>
        </div>

        <div className="grid gap-10 border-t border-border pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0">
          {siteConfig.contactEmail && (
            <section aria-labelledby="contact-heading">
              <h2
                id="contact-heading"
                className="mb-4 text-small font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Contact
              </h2>
              <a
                className="break-all text-body text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                href={`mailto:${siteConfig.contactEmail}`}
              >
                {siteConfig.contactEmail}
              </a>
            </section>
          )}

          {siteConfig.socialLinks.length > 0 && (
            <nav aria-labelledby="social-heading">
              <h2
                id="social-heading"
                className="mb-4 text-small font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Social media
              </h2>
              <ul className="m-0 divide-y divide-border border-y border-border p-0">
                {siteConfig.socialLinks.map((link, index) => (
                  <li className="list-none" key={`${link.label}-${link.href}`}>
                    <a
                      className="group flex min-h-12 items-center justify-between gap-4 py-3 text-body text-foreground transition-colors hover:text-muted-foreground"
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="flex items-center gap-4">
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>{link.label}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-muted-foreground transition-transform group-hover:translate-x-1"
                      >
                        -&gt;
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </section>

      <footer className="flex flex-wrap justify-between gap-2 border-t border-border py-5 text-small text-muted-foreground">
        <span>{siteConfig.name}</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>

      {process.env.NODE_ENV === "development" && <ThemePreview />}
    </main>
  );
}
