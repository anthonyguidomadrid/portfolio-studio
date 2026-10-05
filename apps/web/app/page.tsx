import { getSiteConfig } from "@/lib/site-config";
import { ThemePreview } from "@/components/theme-preview";

export default async function HomePage() {
  const siteConfig = await getSiteConfig();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-content flex-col px-page-gutter">
      <section
        className="flex flex-1 flex-col justify-center py-section"
        aria-labelledby="coming-soon-title"
      >
        <p className="mb-4 text-small font-medium uppercase tracking-wide text-muted-foreground">
          Portfolio
        </p>
        <h1 id="coming-soon-title" className="text-heading-1">
          {siteConfig.name}
        </h1>
        <p className="mt-6 max-w-prose text-body text-muted-foreground">
          Coming soon.
        </p>
      </section>

      {process.env.NODE_ENV === "development" && <ThemePreview />}
    </main>
  );
}
