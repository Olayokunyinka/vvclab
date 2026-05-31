
## Plan: Hello World Hero Section

Replace the placeholder content in `src/routes/index.tsx` with a clean, modern hero section centered on a "Hello World" greeting.

### What it includes
- Full-viewport centered hero
- Large display headline: **Hello, World**
- Supporting subheadline (one sentence intro)
- Primary CTA button ("Get started") and secondary ghost link ("Learn more")
- Subtle radial/gradient background using existing design tokens
- Responsive typography (scales from mobile to desktop)
- Updated `<title>` and meta description for SEO

### Design approach
- Use semantic tokens from `src/styles.css` (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`) — no hardcoded colors
- Shadcn `Button` component for the CTAs
- Tailwind utilities for layout (`min-h-screen`, `flex`, `items-center`, `justify-center`)
- Single `<h1>` for proper semantic structure

### Files touched
- `src/routes/index.tsx` — replace placeholder `Index` component and update `head()` meta

No new dependencies, no backend, no routing changes.
