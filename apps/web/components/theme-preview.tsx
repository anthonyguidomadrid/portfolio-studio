export function ThemePreview() {
  return (
    <section
      aria-labelledby="theme-preview-title"
      className="space-y-8 border-t border-border py-section"
    >
      <header className="space-y-3">
        <p className="text-small font-medium uppercase text-muted-foreground">
          Development theme preview
        </p>
        <h2 id="theme-preview-title" className="text-heading-2">
          Typography and controls
        </h2>
        <p className="max-w-prose text-body text-muted-foreground">
          Preview of the semantic theme tokens used by the application.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <a
          className="text-foreground underline decoration-border underline-offset-4 focus-visible:outline-ring"
          href="#theme-preview-title"
        >
          Text link
        </a>
        <button
          className="rounded-control bg-primary px-5 py-3 text-small font-medium text-primary-foreground"
          type="button"
        >
          Primary action
        </button>
        <button
          className="rounded-control border border-border bg-surface px-5 py-3 text-small font-medium text-surface-foreground"
          type="button"
        >
          Secondary action
        </button>
      </div>

      <div className="rounded-panel border border-border bg-surface p-6 text-surface-foreground">
        <h3 className="text-heading-3">Surface and border</h3>
        <p className="mt-3 text-body text-muted-foreground">
          Supporting text uses the muted foreground token on a white surface.
        </p>
      </div>

      <div className="rounded-panel bg-primary p-6 text-primary-foreground">
        <h3 className="text-heading-3">Inverted section</h3>
        <p className="mt-3 text-body text-primary-foreground/80">
          Black sections use the primary surface and its accessible foreground.
        </p>
      </div>
    </section>
  );
}
