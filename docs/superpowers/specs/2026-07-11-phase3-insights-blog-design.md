# Phase 3a — Bilingual Insights Blog (Design Spec)

**Date:** 2026-07-11
**Status:** Approved — ready for implementation plan
**Scope:** Build the `/insights` bilingual MDX blog. Case studies (`/work`) are explicitly **out of scope** (a later phase, 3b).

## Goal

Make good on a promise the site already makes: the home page renders four static, unlinked "What we think" teasers (`post1–4`) and the footer advertises content that doesn't exist. Ship a real, fully-bilingual (EN/ES) blog authored as in-repo MDX, and rewire the home teasers + nav to it.

## Decisions (locked during brainstorming)

1. **Blog first**, case studies later. A newly-opened firm can write thought-leadership immediately without needing finished client engagements.
2. **MDX in the repo.** Each post is an `.mdx` file; publishing = commit/push (the site auto-deploys on push to `main`). Zero added services, content versioned and fully owned (on-brand: "no proprietary lock-in").
3. **Both languages required, enforced.** Every post exists as an EN and an ES file under a language-neutral slug; a build-time parity check fails the build if a translation is missing (mirrors the existing `messages/{en,es}.json` parity check).
4. **Rendering: native `@next/mdx`** — the approach blessed by this repo's bundled Next 16 docs (`node_modules/next/dist/docs/01-app/02-guides/mdx.md`). Dynamic import of `.mdx` by slug + typed `export const metadata`. No YAML frontmatter (‑`@next/mdx` doesn't parse it by default).
5. **No fabrication.** Seed posts are genuine opinion/educational content. No invented statistics, client names, results, or testimonials (consistent with the standing project rule that skipped the Stitch stats band + fabricated testimonial).

## Non-Goals (YAGNI)

- No `/work` case studies (separate phase).
- No headless CMS, no Notion sync, no comments, no tags beyond a small fixed category set.
- No pagination, search, or RSS in this phase (can be fast-follows once post count justifies them).
- No author system — BIS/Dan Lopez is the implicit single author.

## Architecture

### Content model

```
src/content/insights/
  en/<slug>.mdx
  es/<slug>.mdx        # same <slug>, both required
```

Each `.mdx` file exports typed metadata plus the article body:

```ts
export const metadata = {
  title: string;            // card + <h1> + <title>
  description: string;      // card blurb + meta description + OG
  category: 'Insights' | 'Security' | 'Culture' | 'AI';  // reuses existing home-teaser categories
  date: string;             // ISO 'YYYY-MM-DD', used for sort + display
  readingMinutes: number;   // shown on card + post header
};
```

The `category` union is the single source of truth for allowed categories. Category **display labels** are localized via the `insights` i18n namespace (the union values are stable keys, not user-facing text).

### Content library — `src/lib/insights/index.ts`

A small, testable module that is the only thing that touches the content directory. Interfaces:

- `type Locale = 'en' | 'es'`
- `interface PostMeta { slug: string; title: string; description: string; category: Category; date: string; readingMinutes: number }`
- `listPosts(locale: Locale): Promise<PostMeta[]>` — enumerate the locale's dir (`fs`), dynamically import each file's exported `metadata`, attach `slug` (filename minus `.mdx`), return **sorted by `date` descending**. Async because reading each post's metadata is a dynamic `import()`.
- `getPost(locale, slug): Promise<{ Content: ComponentType; meta: PostMeta } | null>` — dynamically import the MDX module for that locale+slug; return its default export (`Content`) + metadata, or `null` if it doesn't exist.
- `allSlugs(): string[]` — union of slugs across both locales via `fs` directory read (sync; drives `generateStaticParams` and the parity check).
- `missingTranslations(): { slug: string; missing: Locale }[]` — slugs that exist in one locale but not the other, via `fs` directory compare (sync). Empty array = parity holds.

Enumeration uses Node `fs` at build time (these are RSC/build contexts, never client). Dynamic import path is `@/content/insights/${locale}/${slug}.mdx`. The `fs`-based `allSlugs`/`missingTranslations` stay synchronous (no import needed) so the parity test is a plain assertion; the metadata-reading `listPosts`/`getPost` are async.

### MDX components — `mdx-components.tsx` (repo root)

Required by `@next/mdx` for the App Router. Maps MDX elements (`h2`, `h3`, `p`, `ul`, `a`, `blockquote`, `code`, etc.) to Tailwind classes consistent with the existing design tokens (`text-ink`, `text-ink-muted`, `border-hairline`, `text-primary`, etc.) so article typography matches the site.

### Config — `next.config.ts`

Compose `createMDX()` with the existing `withNextIntl()` wrapper (the file already exports `withNextIntl(nextConfig)` and now also holds the www→apex redirect — both must be preserved). Register the `.mdx` loader so `import`ing `.mdx` works. Content lives in `src/content/` (outside `app/`), so posts do **not** become routes on their own; they are imported by the route handlers below. Add `mdx` to `pageExtensions` only if required by the installed `@next/mdx` to resolve the loader — the implementer verifies against the installed package/docs.

### Routes

- **`src/app/[locale]/insights/page.tsx`** (listing, SSG per locale)
  - `listPosts(locale)` → render a localized heading + a grid of linked `InsightCard`s (newest first).
  - `generateMetadata` → localized title (uses the existing `title.template`) + description + canonical/hreflang via the existing `src/lib/seo` helpers.
  - Empty state: localized "no posts yet" message (won't trigger post-seed, but handled).

- **`src/app/[locale]/insights/[slug]/page.tsx`** (post, SSG)
  - `generateStaticParams()` → `{ locale, slug }` for every locale×slug (from `allSlugs()` intersected with what exists per locale).
  - Body: `getPost(locale, slug)`; if `null` → `notFound()`. Render an article header (category label, `<h1>` title, localized date, "X min read") then `<Content />` inside a prose container styled by `mdx-components.tsx`.
  - `generateMetadata` → from the post's `metadata`: title, description, canonical + hreflang alternates for the sibling locale, and OG (reuse the existing dynamic `/og?title=` route).

### Wiring existing UI

- **Home "What we think"** (`src/app/[locale]/page.tsx`): replace the four hardcoded `InsightCard`s (`post1–4`) with the **latest 3** from `listPosts(locale)`, each linking to its post. Remove the now-unused `post1*..post4*` message keys from both `messages` files (keeps parity).
- **Header nav** (`src/components/layout/Header.tsx`): add **Insights** as a 6th item (desktop + mobile menu) → new `nav.insights` string (EN/ES).
- **`InsightCard`** (`src/components/marketing/InsightCard.tsx` or current location): extend props with `href`, optional `date`, `readingMinutes`; wrap in the i18n `Link`. Preserve the current visual.
- **Footer:** unchanged — the "Case Studies" text remains a placeholder for the future `/work` phase.

### i18n

New top-level `insights` namespace in `messages/en.json` + `messages/es.json` (identical key sets — parity test already guards this):

```
insights: {
  heading, subheading, readArticle, minRead, backToInsights, emptyState,
  categories: { Insights, Security, Culture, AI }   // localized display labels
}
```

Plus `nav.insights`. Dates are formatted per-locale with `Intl.DateTimeFormat(locale)` (or the next-intl formatter).

### Seed content

Ship **2–3 short, genuine posts** (EN+ES each), drafted during implementation for the owner to review:
- e.g. "Find your first hour back" (the free-assessment thesis), "Why bilingual product design is a growth lever," and one security/AI-adoption piece.
- Real opinion/education only. No fabricated metrics, clients, or outcomes. ES is AI-drafted for owner review (same standing caveat as the rest of the site's ES copy).

## Testing

- **Unit (`src/lib/insights/__tests__/`):**
  - `missingTranslations()` returns `[]` for the seeded content — the **parity enforcement**; a dedicated test asserts empty so the build/test fails if a future post is added in only one language.
  - `listPosts` returns posts sorted by `date` descending.
  - `getPost` returns metadata for a known slug and `null` for an unknown slug.
- **Component:** `InsightCard` renders title + category + is a link to the right href (native matchers, per repo convention — no jest-dom).
- **Build:** `npm run build` compiles MDX and emits every post route; `npm run lint` clean.
- **e2e (`e2e/insights.spec.ts`):** `/en/insights` lists ≥1 post → click a card → post page shows the `<h1>`; `/es/insights` mirrors; a post page exposes `hrefLang` alternates.

## Success criteria

1. `/en/insights` and `/es/insights` list the seeded posts, newest first, each card linking to a rendered bilingual post.
2. Every post exists in both languages; adding a post in only one language fails the build (parity test).
3. Home "What we think" shows the latest 3 real posts (no more placeholder titles); **Insights** appears in the nav.
4. Per-post SEO: localized title/description, canonical, hreflang pair, OG image.
5. Lint clean, unit + e2e green, production build succeeds. Deploy is a push to `main` (auto-deploy); posts publish the same way.

## Risks / notes for the implementer

- **AGENTS.md caveat applies:** this is a modified Next 16. Before writing config/routes, read `node_modules/next/dist/docs/01-app/02-guides/mdx.md` and the installed `@next/mdx` README; verify the `createMDX` composition with `withNextIntl`, whether `pageExtensions` is needed, and the dynamic-import + `export const metadata` pattern against the installed version. Note any deviation.
- **Preserve** the existing `next.config.ts` contents: the `withNextIntl` wrapper **and** the www→apex `redirects()` rule.
- `@next/mdx` App Router **requires** a root `mdx-components.tsx` or MDX will not render.
- Content is build-time/RSC only — never import the content lib into a client component.
- Repo test convention: native Vitest matchers only (no jest-dom); commit with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com"`.
