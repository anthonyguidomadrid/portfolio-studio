import type { SiteConfig } from "@/lib/site-config";

interface ComingSoonPageProps {
  eyebrow: string;
  siteConfig: SiteConfig;
  title?: string;
}

export function ComingSoonPage({
  eyebrow,
  siteConfig,
  title,
}: ComingSoonPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col px-page-gutter">
      <section
        className="flex flex-1 items-center py-section"
        aria-labelledby="profile-title"
      >
        <div className="w-full">
          <p className="mb-5 text-small font-medium uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </p>
          <h1 id="profile-title" className="max-w-[12ch] text-heading-1">
            {title ?? siteConfig.name}
          </h1>
          <p className="mt-7 max-w-prose text-heading-3 font-normal normal-case text-muted-foreground">
            {siteConfig.description}
          </p>
          <p className="mt-6 text-small font-medium uppercase tracking-wide text-muted-foreground">
            Coming soon.
          </p>
        </div>
      </section>
    </main>
  );
}
