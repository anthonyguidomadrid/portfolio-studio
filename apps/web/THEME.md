# Frontend Theme

Tailwind CSS 4 is configured CSS-first in `app/globals.css`; there is intentionally no `tailwind.config.*` file. Change the `@theme` variables there to rebrand colors, type, width, spacing, focus ring, or control/panel radii. Montserrat is loaded through `next/font/google` in `app/layout.tsx` and exposed as `--font-montserrat`.

Use semantic utilities in markup:

- Page colors: `bg-background text-foreground`
- Framed areas: `bg-surface text-surface-foreground border-border`
- Secondary copy: `bg-muted-surface text-muted-foreground`
- Actions: `bg-primary text-primary-foreground`
- Width and spacing: `max-w-content px-page-gutter py-section`
- Type: `text-body`, `text-small`, `text-heading-1`, `text-heading-2`, and `text-heading-3`
- Controls: `rounded-control` or `rounded-panel`

Headings receive uppercase styling globally; keep their source text (including CMS text) unchanged. Use the primary/foreground pair for inverted black sections. Photographs stay in color by default; apply Tailwind's `grayscale` utility only where that treatment is intentional. Prefer utilities directly in components; keep global CSS limited to theme tokens, base typography/focus behavior, and reduced-motion handling.

The Home page includes a theme specimen only in development mode. It demonstrates typography, a link, primary/secondary buttons, borders, and an inverted section. It is excluded from production rendering.
