import { messages } from "@/messages/en";

export function ThemePreview() {
  return (
    <section
      aria-labelledby="theme-preview-title"
      className="space-y-8 border-t border-border py-section"
    >
      <header className="space-y-3">
        <p className="text-small font-medium uppercase text-muted-foreground">
          {messages.themePreview.eyebrow}
        </p>
        <h2 id="theme-preview-title" className="text-heading-2">
          {messages.themePreview.title}
        </h2>
        <p className="max-w-prose text-body text-muted-foreground">
          {messages.themePreview.description}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <a
          className="text-foreground underline decoration-border underline-offset-4 focus-visible:outline-ring"
          href="#theme-preview-title"
        >
          {messages.themePreview.link}
        </a>
        <button
          className="rounded-control bg-primary px-5 py-3 text-small font-medium text-primary-foreground"
          type="button"
        >
          {messages.themePreview.primaryAction}
        </button>
        <button
          className="rounded-control border border-border bg-surface px-5 py-3 text-small font-medium text-surface-foreground"
          type="button"
        >
          {messages.themePreview.secondaryAction}
        </button>
      </div>

      <div className="rounded-panel border border-border bg-surface p-6 text-surface-foreground">
        <h3 className="text-heading-3">{messages.themePreview.surfaceTitle}</h3>
        <p className="mt-3 text-body text-muted-foreground">
          {messages.themePreview.surfaceDescription}
        </p>
      </div>

      <div className="rounded-panel bg-primary p-6 text-primary-foreground">
        <h3 className="text-heading-3">
          {messages.themePreview.invertedTitle}
        </h3>
        <p className="mt-3 text-body text-primary-foreground/80">
          {messages.themePreview.invertedDescription}
        </p>
      </div>
    </section>
  );
}
