# Measure & Get Found — Design Spec

**Date:** 2026-07-08
**Status:** Approved (pending spec review)
**Repo:** https://github.com/dlopez2392/BIS-Website (live: https://bis-rgv.com)
**Context:** Improvement package #1 of the post-launch roadmap for the BIS marketing site (Phases 1 + 2 already shipped). Bundles two small, independent sub-projects — **Analytics & conversion tracking** and an **SEO package** — into one spec/plan because both are low-risk marketing-site enhancements with no interdependency.

Sibling sub-projects (separate future cycles, not this spec): #3 Calendar booking, #4 Bilingual AI assistant.

---

## Goal

Make the site's performance **measurable** (so future improvements can be judged, not guessed) and **discoverable** (so a brand-new bilingual RGV firm shows up in local + Spanish-language search).

## Decisions (locked)

| Decision | Choice |
|---|---|
| Analytics platform | **Vercel Web Analytics + Speed Insights** (cookieless → no consent banner) |
| Business location | **Service-area, city-level**: base Harlingen, TX; area served = Rio Grande Valley. No street address. |
| Public phone | **Yes** — Dan provides a number; built with a placeholder until then |
| OG/social images | **Dynamically generated** branded card (Next `opengraph-image` / `ImageResponse`) |

---

## Part A — Analytics & conversion tracking

- Add `@vercel/analytics` `<Analytics/>` and `@vercel/speed-insights` `<SpeedInsights/>` to the root `src/app/[locale]/layout.tsx` (inside `<body>`, once, applies to all locales/pages).
- Cookieless — **no consent banner required**.
- Conversion event: on a **successful** contact submit, `ContactForm` fires `track('lead_submitted', { locale, industry })` (from `@vercel/analytics`). Only on `{ ok: true }`; never on validation error, honeypot, or failure.
- **Success criteria:** pageviews + Core Web Vitals appear in the Vercel dashboard; a real form submit registers a `lead_submitted` custom event segmentable by `locale` and `industry`.

## Part B — SEO

1. **`metadataBase` + per-page metadata.** Set `metadataBase = new URL('https://bis-rgv.com')` in the root layout. Each of the 5 pages (Home, Services, Industries, About, Contact) gets its **own** title + description via a per-page `generateMetadata`, sourced from new per-page keys in the `meta` next-intl namespace (EN + ES, identical key sets). Replaces the current single shared title/description.

2. **hreflang + canonical.** Each page's `generateMetadata` emits `alternates.canonical` (self, absolute) and `alternates.languages` with `en`, `es`, and `x-default` pointing at the correct locale URLs, so Google serves EN to English searchers and ES to Spanish searchers. Extend `sitemap.ts` so each URL carries its `alternates.languages`.

3. **Structured data (JSON-LD).** A site-wide `ProfessionalService` block, rendered once via a small `StructuredData` server component in the layout (a `<script type="application/ld+json">`):
   - `name`: "Bespoke Intelligent Solutions"
   - `url`: https://bis-rgv.com
   - `description`: short EN description
   - `areaServed`: Rio Grande Valley + cities (McAllen, Harlingen, Brownsville, Edinburg)
   - `address`: `{ "@type": "PostalAddress", addressLocality: "Harlingen", addressRegion: "TX", addressCountry: "US" }` (no street)
   - `telephone`: the provided number (placeholder until Dan supplies it)
   - `email`: bespokeintelligentsolutions@gmail.com
   - `founder`: `{ "@type": "Person", name: "Dan Lopez" }`
   - `availableLanguage`: ["English", "Spanish"]
   - `sameAs`: [LinkedIn URL] — included only if Dan provides one; otherwise omitted
   - `makesOffer` / service list: AI & Automation, IT Consulting & Security, Website Design (optional, light)
   Kept to one focused block; `BreadcrumbList` and per-page schemas are out of scope (YAGNI).

4. **Social / OG images.** A dynamically generated branded OG card via Next's `opengraph-image.tsx` using `ImageResponse` — a `bis>`-branded 1200×630 card showing the wordmark, tagline, and the page title. Wire `openGraph` + `twitter` (summary_large_image) metadata in `generateMetadata`. One generator, per-page title. (No hand-made static PNGs.)

## Off-site (Dan's action — noted, not built)

- Create a **Google Business Profile** as a service-area business (Harlingen + Rio Grande Valley, no street address) with the same Name/Phone as the site markup (NAP consistency). Single biggest local-SEO lever, but a Google dashboard task, not code.

## Testing

- **Analytics:** a component test asserting `track` is called with `'lead_submitted'` and the right payload on a successful submit, and NOT called on validation error / honeypot / failure (mock `@vercel/analytics`).
- **SEO:**
  - Test/e2e that each of the 5 pages emits a **unique** `<title>` and a self-`canonical`, and that `hreflang` alternates for `en`/`es`/`x-default` are present.
  - Test that the layout renders a `ProfessionalService` JSON-LD `<script>` and that it parses to valid JSON with `@type: "ProfessionalService"`, `areaServed`, and `availableLanguage`.
  - Test that the OG image route returns HTTP 200 with an image content-type.
- Message-key parity (EN/ES) preserved for all new `meta` keys.

## Out of scope (later / other cycles)

- Calendar booking (#3), AI assistant (#4).
- GA4 / Google Ads, A/B testing, heatmaps.
- Per-page unique OG *art* beyond title text; `BreadcrumbList`/FAQ/Review schema.
- Actually creating the Google Business Profile (Dan's dashboard task).

## Open items to supply before launch

- **Phone number** (real business/Google Voice number) — replaces the placeholder in the JSON-LD (and optionally shown on the Contact page).
- **LinkedIn URL** (optional) — for `sameAs`.
