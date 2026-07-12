# Animated Hero + Violet/Cyan Palette Refresh (Design Spec)

**Date:** 2026-07-12
**Status:** Approved — ready for implementation plan
**Scope:** Replace the plain home hero with an animated "constellation network" hero, and refresh the whole-site palette from blue+gold to violet+cyan (both light & dark modes, dark-first). Chosen live in the visual-companion brainstorm.

## Decisions (locked)

1. **Hero style:** Constellation Network — a `<canvas>` field of drifting nodes with connecting lines, cursor-reactive, behind the hero copy. Reads as "connected IT."
2. **Palette:** Violet primary + Cyan accent, replacing blue primary + gold accent. **Gold is retired** (its token/usages migrate to cyan `accent`).
3. **Scope:** Full-site refresh — all pages, both light & dark modes. Semantic tokens mean most of the recolor is token-level.
4. **Priority:** Dark-first (the wow lives in dark; light mode is a clean, correct companion).
5. **Bold & tech-forward** feel (chosen calibration): a clear on-load wow that stays enterprise-credible.
6. **Secondary CTA kept:** hero gets a primary violet CTA + a secondary "ghost" button ("Book a free assessment").

## Palette tokens (`src/app/globals.css`, AA-verified)

Rename `--color-gold` → `--color-accent`; keep all other token names. Values:

| Token | Dark (`.dark`) | Light (`:root`) |
|---|---|---|
| `--color-surface` | `#0b0a18` | `#faf9ff` |
| `--color-surface-alt` | `#14122a` | `#ffffff` |
| `--color-ink` | `#f3f0ff` | `#171528` |
| `--color-ink-muted` | `#b9b2d6` | `#4a4763` |
| `--color-primary` | `#8b5cf6` | `#7c3aed` |
| `--color-on-primary` | `#ffffff` | `#ffffff` |
| `--color-accent` | `#22d3ee` | `#0891b2` |
| `--color-hairline` | `#262340` | `#e7e3f5` |

Update the `@theme inline` block to expose `--color-accent` (drop `--color-gold`). Implementer must verify AA contrast (≥4.5 normal text, ≥3 large/UI) for: ink & ink-muted on both surfaces; primary as a link/text on surfaces; on-primary (white) on the primary button. If the violet button fails white-text AA, darken the button primary a step (document the value used).

## Gold → accent migration (14 usages)

Change `text-gold` → `text-accent` and `bg-gold` → `bg-accent` in: `about/page.tsx` (4×), `contact/page.tsx` (1× `bg-gold`), `insights/[slug]/page.tsx` (1×), `Announcement.tsx`, `CapabilityBand.tsx` (`bg-gold`), `IndustryCard.tsx`, `InsightCard.tsx`, `MethodStep.tsx`, `SectionHeading.tsx`. No `gold` string should remain in `src/` after this (a grep gate).

## Hero component — `src/components/marketing/Hero.tsx`

A **client component** (`'use client'`, canvas needs the browser). Structure:
- A full-width `<section>` (dark violet radial-gradient background) containing:
  - `<canvas aria-hidden>` absolutely positioned, behind content — the constellation. Nodes violet `#a78bfa`, links `rgba(139,92,246,α)` fading with distance; cursor-reactive (gentle repel within ~110px).
  - A vignette overlay (radial, `surface`-toned) for text legibility.
  - Content (real DOM, z-above canvas): cyan **kicker**, `<h1>` headline with a **violet→cyan gradient** on the "Intelligent Solution" phrase, body `<p>`, and a `.row` with the primary violet CTA (soft glow) + secondary ghost button.
- **Entrance:** staggered fade-up (kicker→h1→body→CTAs) via CSS keyframes in `globals.css`.
- Copy via existing `home` i18n; add keys `heroKicker` + `heroCta2` (EN/ES, parity).

**Canvas behavior (perf + a11y):**
- Particle count scaled to viewport area and **capped** (e.g. `min(70, area/12000)`).
- **DPR-aware** sizing (crisp on retina).
- `requestAnimationFrame` loop **paused when the hero is offscreen** (IntersectionObserver) and on tab blur; cleaned up on unmount.
- `prefers-reduced-motion: reduce` → draw the constellation **once** (no rAF) and disable the entrance animation (content visible immediately).
- Canvas is decorative (`aria-hidden`), so the headline/CTAs remain the accessible/SEO content.

Mount: replace the current plain hero `<section>` in `src/app/[locale]/page.tsx` with `<Hero locale={locale} />` (or pass the resolved strings). Keep the existing `heroTitle/heroBody/heroCta` keys; add `heroKicker`, `heroCta2`.

## Testing

- **Unit** (`Hero.test.tsx`): mock `HTMLCanvasElement.getContext` + `requestAnimationFrame`; assert the headline text, primary CTA, and secondary CTA render, and that the canvas is `aria-hidden`. A reduced-motion assertion optional (matchMedia-mock).
- **i18n parity** holds after adding the 2 keys.
- **Build/lint** clean; hero prerenders on `/[locale]` (the `'use client'` island is fine inside the server page).
- **e2e** (`hero.spec.ts` — extend existing): home shows the headline `<h1>` and the primary CTA; both locales.
- **Manual visual pass** (owner + me): all 6 pages in BOTH light & dark — contrast, CTA legibility, no leftover blue/gold, marquee logos (they use `ink-muted`, auto-adapt).

## Success criteria

1. Home hero shows the animated violet constellation + entrance + gradient headline + two CTAs; cursor-reactive; static + no-entrance under reduced-motion.
2. Site palette is violet/cyan across all pages, both modes, AA-verified; zero `gold` tokens/classes remain.
3. Canvas is aria-hidden, paused offscreen, DPR-aware; Lighthouse perf not materially regressed.
4. Lint clean, unit + e2e green, build succeeds, i18n parity holds. Deploy = push to `main`.

## Risks / notes

- **AGENTS.md:** modified Next 16 — the hero is a client island inside the server page; follow existing `'use client'` patterns (e.g. `MobileNav`, `ChatWidget`).
- Contrast is the main risk — violet-on-dark and white-on-violet need checking; tune shades and document.
- The retheme is broad but low-risk (semantic tokens). The one deliberate content-visible brand change is **dropping gold** (owner-confirmed).
- Keep the constellation to the hero only (not site-wide) to protect performance.
- Repo conventions: native Vitest matchers only; commit with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com"`.
