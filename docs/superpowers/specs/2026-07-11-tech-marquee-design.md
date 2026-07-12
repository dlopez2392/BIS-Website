# Tech Marquee — "Platforms we work with" (Design Spec)

**Date:** 2026-07-11
**Status:** Approved — ready for implementation plan
**Scope:** A rotating (infinite auto-scroll) monochrome logo strip of platforms/vendors the founder has worked with, on the home page. The full categorized technology inventory (the ~150-item list, including non-logo items and Areas of Expertise) is a SEPARATE future piece — a `/capabilities` page — explicitly OUT of scope here.

## Goal

Give instant visual credibility near the top of the home page: a tasteful, rotating strip of ~24 recognizable brand logos under an honest label, showing the breadth of platforms BIS works across.

## Decisions (locked during brainstorming)

1. **Marquee first**, `/capabilities` page later (its own spec→plan cycle).
2. **Label (honest framing, no implied partnership/endorsement):** EN "Platforms we work with" / ES "Plataformas y herramientas con las que trabajamos". Logos are used nominatively to indicate hands-on experience — NOT "partners"/"trusted by".
3. **Rotating:** seamless infinite horizontal auto-scroll, slow drift, **pause on hover**.
4. **Monochrome + theme-adaptive:** logos render as single-tone silhouettes that adapt to light/dark (muted ink tone, brightening slightly on hover) so a row of clashing brand colors stays clean.
5. **Accessible:** honors `prefers-reduced-motion` (falls back to a static wrapping grid, no animation); every logo has an accessible name.
6. **Curated ~24**, not all 150. Non-logo technologies/protocols and Areas of Expertise belong on the future `/capabilities` page.
7. **Logos** sourced as SVGs from the open-source `simple-icons` set into `public/logos/`; any curated brand not cleanly available there is swapped for another recognizable brand or flagged for the owner to supply (do NOT ship a broken/placeholder logo).

## Non-Goals (YAGNI)

- No `/capabilities` page, no full inventory, no Areas-of-Expertise band (separate phase).
- No click-through/links on logos, no tooltips beyond the accessible name, no CMS — the roster is a small typed list in the repo.
- No per-logo brand colors (monochrome by design).

## Architecture

### Curated roster (starting set — owner may veto/add)

Cloud/Infra: Microsoft, Azure, AWS, Google Workspace, VMware · Networking: Cisco, Fortinet, Ubiquiti · Security: CrowdStrike, Proofpoint, Malwarebytes, Bitdefender · Backup/Storage: Datto, Veeam, Synology · Remote/Comms: TeamViewer, Zoom, RingCentral · Apps/CRM: Salesforce, Adobe, Dropbox · Dev/AI: GitHub, OpenAI, Anthropic, Supabase, Python · Hardware: Dell, HP, Lenovo, Apple.

The FINAL set is whatever has a clean `simple-icons` SVG at implementation time; any gap is swapped or owner-supplied. Target ~24–30 logos.

### Data — `src/lib/tech/logos.ts`

A typed list, the single source of truth for the marquee:

```ts
export interface TechLogo { name: string; file: string; } // file = /logos/<file>.svg
export const techLogos: TechLogo[] = [ { name: 'Microsoft', file: 'microsoft' }, /* … */ ];
```

`name` is the human/accessible label; `file` is the SVG basename in `public/logos/`.

### Component — `src/components/marketing/TechMarquee.tsx`

A server component (no client JS needed — animation + hover-pause are pure CSS):

- Renders the localized label (from a new `techMarquee` i18n namespace), then a marquee viewport.
- **Seamless loop:** the logo track is rendered **twice** back-to-back inside an overflow-hidden viewport; the track translates from 0 to -50% via a CSS animation, so when the first copy scrolls off, the second is exactly in place — no visible jump. The duplicated copy is `aria-hidden` so screen readers announce each logo once.
- Each logo is a **CSS-masked box** (not `<img>`): a span with `mask-image: url(/logos/<file>.svg)` + `background-color: currentColor` (or a muted tone var), sized ~`h-8`. Masking renders the single-path simple-icons SVG as a solid silhouette tinted by the current text color, giving free light/dark adaptation and uniform monochrome. Accessible name via `role="img"` + `aria-label={name}`.
- Edge fade (optional): a subtle left/right gradient mask on the viewport so logos fade in/out at the edges rather than hard-cutting.

### Styles — `src/app/globals.css`

Add a `@keyframes marquee-scroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }` and the animation utility (Tailwind v4 is CSS-first, no JS config). Duration ~40s, `linear`, `infinite`. `.group:hover` (or `:hover` on the viewport) sets `animation-play-state: paused`. Wrap the animation in `@media (prefers-reduced-motion: no-preference)`. Both track copies always exist in the DOM (the duplicate is `aria-hidden`); under `prefers-reduced-motion: reduce` the CSS sets `display:none` on the aria-hidden duplicate and makes the primary track `flex-wrap` (static, no animation) — so reduced-motion users see each logo exactly once with no movement, and no JS branch is needed.

### Placement — `src/app/[locale]/page.tsx`

Insert `<TechMarquee />` immediately **after the hero `<section>`** and before `<Announcement>`. Full-bleed-ish horizontal strip within the page's normal vertical rhythm.

### i18n

New top-level `techMarquee` namespace in `messages/{en,es}.json` (identical keys, parity-guarded):

```
techMarquee: { label: "Platforms we work with" | "Plataformas y herramientas con las que trabajamos" }
```

## Testing

- **Unit (`src/components/marketing/__tests__/TechMarquee.test.tsx`):** renders the label; renders one accessible-named element per entry in `techLogos` (assert count and that a known name like "Microsoft" is present) using native Vitest matchers (no jest-dom). The reduced-motion/animation behavior is pure CSS and is not unit-tested (verified visually + by build).
- **Build/lint:** `npm run build` succeeds (component + assets resolve); `npm run lint` clean; i18n parity `equal true`.
- **e2e (`e2e/marquee.spec.ts`):** on `/en`, the marquee label is visible and at least one logo element (by `aria-label`) is present.

## Success criteria

1. Home page shows a rotating, seamless, pause-on-hover strip of the curated monochrome logos under the honest bilingual label, below the hero.
2. Logos adapt to light/dark (monochrome silhouettes) and look uniform.
3. `prefers-reduced-motion` users see a static, non-animated grid of the same logos.
4. Every logo has an accessible name; the duplicated loop copy is hidden from assistive tech.
5. Lint clean, unit + e2e green, production build succeeds, i18n parity holds. Deploy = push to `main`.

## Risks / notes for the implementer

- **AGENTS.md caveat:** modified Next 16 — this is a static server component + CSS, low risk, but keep to existing patterns.
- **simple-icons availability:** verify each curated brand has an SVG; some (e.g., Litify, Datto, Axcient, RingCentral, Proofpoint) may be missing — swap for another recognizable brand or list them for the owner. Never ship a placeholder/broken logo. Record the final shipped roster + any gaps in the report.
- **Trademark/monochrome:** simple-icons provides single-color brand marks; rendering them monochrome via CSS mask is standard nominative use. The "Platforms we work with" label keeps framing honest (no implied endorsement).
- **CSS mask cross-browser:** use both `mask-image` and `-webkit-mask-image` for Safari.
- Repo conventions: native Vitest matchers only; commit with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com"`.
