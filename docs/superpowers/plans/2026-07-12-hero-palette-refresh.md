# Animated Hero + Violet/Cyan Palette Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the site palette to violet/cyan (both modes) and replace the plain home hero with an animated cursor-reactive "constellation" hero.

**Architecture:** Palette lives in semantic CSS tokens (`globals.css`), so the recolor is token-level plus a `gold→accent` rename/migration. The hero is a `'use client'` canvas island mounted inside the server home page; all its text stays real DOM (i18n) with the canvas `aria-hidden`.

**Tech Stack:** Next 16 App Router · next-intl v4 · Tailwind v4 (CSS-first tokens) · Canvas 2D · Vitest + Playwright.

## Global Constraints

- Work from repo root `C:\Users\danlo\BIS-Website`. Node 24, npm. Branch: create `feat/hero-palette` off `main` (do not work on `main`).
- **Palette (AA-verified), both modes** — exact token values in Task 1. `--color-gold` is renamed to `--color-accent`; NO `gold` string may remain in `src/` after Task 1 (grep gate).
- **Dark-first**: `.dark` is the primary experience; `:root` (light) is a clean companion.
- **Hero**: `'use client'` component; `<canvas aria-hidden>`; particle count `min(70, round(W*H/12000))`; DPR-capped at 2; `requestAnimationFrame` paused when offscreen (IntersectionObserver) ; `prefers-reduced-motion: reduce` → draw once, no entrance. Real DOM text for SEO/screen-readers.
- Native Vitest matchers only (no jest-dom). Reuse `Link` from `@/i18n/navigation`.
- i18n EN/ES key sets identical (parity). Commit with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit`.
- Every task ends green: `npm run lint` clean, `npm run build` succeeds, relevant tests pass.

---

### Task 1: Palette retheme (tokens + gold→accent migration)

**Files:**
- Modify: `src/app/globals.css` (`:root`, `.dark`, `@theme inline`)
- Modify (gold→accent, 14 usages): `src/app/[locale]/about/page.tsx`, `src/app/[locale]/contact/page.tsx`, `src/app/[locale]/insights/[slug]/page.tsx`, `src/components/marketing/Announcement.tsx`, `src/components/marketing/CapabilityBand.tsx`, `src/components/marketing/IndustryCard.tsx`, `src/components/marketing/InsightCard.tsx`, `src/components/marketing/MethodStep.tsx`, `src/components/ui/SectionHeading.tsx`

**Interfaces:** Produces the `--color-accent` token (replaces `--color-gold`) + violet/cyan palette consumed everywhere.

- [ ] **Step 1: Update the token values + rename gold→accent**

In `src/app/globals.css`, set `:root` and `.dark` blocks to these values and rename `--color-gold` → `--color-accent` in all three places (`:root`, `.dark`, `@theme inline`):

```css
:root {
  --color-surface: #faf9ff;
  --color-surface-alt: #ffffff;
  --color-ink: #171528;
  --color-ink-muted: #4a4763;
  --color-primary: #7c3aed;
  --color-on-primary: #ffffff;
  --color-accent: #0891b2;
  --color-hairline: #e7e3f5;
  --font-sans: var(--font-hanken), system-ui, sans-serif;
}
.dark {
  --color-surface: #0b0a18;
  --color-surface-alt: #14122a;
  --color-ink: #f3f0ff;
  --color-ink-muted: #b9b2d6;
  --color-primary: #8b5cf6;
  --color-on-primary: #ffffff;
  --color-accent: #22d3ee;
  --color-hairline: #262340;
}
```

And in `@theme inline`, replace the `--color-gold: var(--color-gold);` line with `--color-accent: var(--color-accent);`.

- [ ] **Step 2: Migrate the 14 gold usages → accent**

In each listed file, replace `text-gold` → `text-accent` and `bg-gold` → `bg-accent`. (These are the exact occurrences: `about/page.tsx` 4× `text-gold`; `contact/page.tsx` 1× `bg-gold`; `insights/[slug]/page.tsx` 1× `text-gold`; `Announcement.tsx`, `IndustryCard.tsx`, `InsightCard.tsx`, `SectionHeading.tsx` 1× `text-gold` each; `MethodStep.tsx` 1× `text-gold`; `CapabilityBand.tsx` 1× `bg-gold`.)

- [ ] **Step 3: Grep gate — no gold remains**

Run: `grep -rn "gold" src` → expect **no matches**. If any remain, fix them.

- [ ] **Step 4: Verify AA contrast (document results)**

Confirm (any contrast checker / reasoning) AA for: `ink`/`ink-muted` on `surface` (both modes); white (`on-primary`) on `primary` button — if dark `#8b5cf6` with white text is below 4.5:1 for the button's bold text, that is acceptable at AA-large (3:1) for the ≥14px bold CTA; note the ratio. Record the checked pairs in the report.

- [ ] **Step 5: Build + lint + commit**

Run: `npm run build` → succeeds. `npm run lint` → clean.

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: violet/cyan palette refresh (both modes) + gold→accent migration"
```

---

### Task 2: Hero component + entrance CSS + i18n + unit test

**Files:**
- Create: `src/components/marketing/Hero.tsx`
- Modify: `src/app/globals.css` (hero background/vignette/gradient + entrance keyframes)
- Modify: `messages/en.json`, `messages/es.json` (`home` namespace hero keys)
- Test: `src/components/marketing/__tests__/Hero.test.tsx`

**Interfaces:**
- Produces: `Hero({ kicker, title, titleAccent, body, cta, cta2 }: { kicker: string; title: string; titleAccent: string; body: string; cta: string; cta2: string })` — a `'use client'` section rendering the constellation canvas + entrance content.

- [ ] **Step 1: Repurpose/add hero i18n keys (EN)**

In `messages/en.json` `home`: change `heroTitle` to the lead only and add three keys:
```json
"heroTitle": "Let us Be your",
"heroTitleAccent": "Intelligent Solution.",
"heroKicker": "Bespoke Intelligent Solutions · Built for the Valley",
"heroCta2": "Book a free assessment",
```
(Keep `heroBody` and `heroCta` as-is.)

- [ ] **Step 2: Repurpose/add hero i18n keys (ES)**

In `messages/es.json` `home`:
```json
"heroTitle": "Deja que seamos tu",
"heroTitleAccent": "Solución Inteligente.",
"heroKicker": "Bespoke Intelligent Solutions · Hecho para el Valle",
"heroCta2": "Reserva una evaluación gratuita",
```
(Keep `heroBody` and `heroCta` as-is.)

- [ ] **Step 3: Write the failing Hero test**

Create `src/components/marketing/__tests__/Hero.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '../Hero';

beforeAll(() => {
  // jsdom has no 2D canvas; returning null makes Hero's effect bail early + keeps output pristine.
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

describe('Hero', () => {
  it('renders the full headline, both CTAs, and a decorative (aria-hidden) canvas', () => {
    const { container } = render(
      <Hero kicker="Kick" title="Let us Be your" titleAccent="Intelligent Solution."
        body="Body copy" cta="See how we do it" cta2="Book a free assessment" />,
    );
    expect(screen.getByRole('heading', { name: /Let us Be your Intelligent Solution\./i })).toBeTruthy();
    expect(screen.getByText(/See how we do it/)).toBeTruthy();
    expect(screen.getByText('Book a free assessment')).toBeTruthy();
    expect(container.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/components/marketing/__tests__/Hero.test.tsx`
Expected: FAIL — cannot resolve `../Hero`.

- [ ] **Step 5: Implement the Hero component**

Create `src/components/marketing/Hero.tsx`:

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';

export function Hero({
  kicker, title, titleAccent, body, cta, cta2,
}: { kicker: string; title: string; titleAccent: string; body: string; cta: string; cta2: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0, visible = true;
    let pts: { x: number; y: number; vx: number; vy: number }[] = [];
    const mouse = { x: -999, y: -999 };

    const size = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const seed = () => {
      const n = Math.min(70, Math.round((W * H) / 12000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      }));
    };
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        const dxm = p.x - mouse.x, dym = p.y - mouse.y, dm = Math.hypot(dxm, dym);
        if (dm < 110) { p.x += (dxm / dm) * 1.1; p.y += (dym / dm) * 1.1; }
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.7, 0, Math.PI * 2); ctx.fillStyle = '#a78bfa'; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(139,92,246,${(1 - d / 130) * 0.5})`; ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && !reduce) raf = requestAnimationFrame(frame); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const onMove = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onLeave = () => { mouse.x = -999; mouse.y = -999; };
    const onResize = () => { size(); seed(); };

    size(); seed();
    if (reduce) frame(); else start();
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', onResize);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); });
    io.observe(canvas);

    return () => {
      stop(); io.disconnect();
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <section className="hero-anim relative flex min-h-[560px] items-center overflow-hidden">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div className="hero-vign pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <p className="hero-rise hero-d1 text-xs font-bold uppercase tracking-[0.2em] text-accent">{kicker}</p>
        <h1 className="hero-rise hero-d2 mt-4 max-w-3xl text-5xl font-extrabold tracking-tight text-ink">
          {title} <span className="hero-grad">{titleAccent}</span>
        </h1>
        <p className="hero-rise hero-d3 mt-5 max-w-xl text-lg text-ink-muted">{body}</p>
        <div className="hero-rise hero-d4 mt-7 flex flex-wrap items-center gap-4">
          <Link href="/services" className="rounded-lg bg-primary px-6 py-3 font-bold text-on-primary shadow-[0_8px_30px_-8px_var(--color-primary)]">{cta} →</Link>
          <Link href="/contact" className="rounded-lg border border-hairline px-5 py-3 font-semibold text-ink-muted hover:text-ink">{cta2}</Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/components/marketing/__tests__/Hero.test.tsx`
Expected: PASS.

- [ ] **Step 7: Add hero CSS to `globals.css`**

Append to `src/app/globals.css`:

```css
/* --- Animated hero --- */
.hero-anim {
  background: radial-gradient(ellipse 80% 60% at 75% 8%,
    color-mix(in oklab, var(--color-primary) 22%, var(--color-surface)) 0%,
    var(--color-surface) 55%);
}
.hero-vign {
  background: radial-gradient(ellipse at 30% 50%, transparent 30%, var(--color-surface) 100%);
  opacity: .85;
}
.hero-grad {
  background: linear-gradient(100deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
@keyframes hero-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: no-preference) {
  .hero-rise { opacity: 0; animation: hero-rise .7s forwards; }
  .hero-d1 { animation-delay: .10s; } .hero-d2 { animation-delay: .22s; }
  .hero-d3 { animation-delay: .34s; } .hero-d4 { animation-delay: .46s; }
}
```
(Under reduced-motion the `.hero-rise` opacity/animation rules don't apply — content is visible immediately.)

- [ ] **Step 8: Verify parity, build, lint, commit**

Run parity:
```bash
node -e "const a=require('./messages/en.json'),b=require('./messages/es.json');const k=o=>Object.entries(o).flatMap(([n,v])=>typeof v==='object'&&v?Object.keys(v).flatMap(x=>typeof v[x]==='object'&&v[x]?Object.keys(v[x]).map(y=>n+'.'+x+'.'+y):[n+'.'+x]):[n]).sort();console.log('equal',JSON.stringify(k(a))===JSON.stringify(k(b)));"
```
Expected: `equal true`.
Run: `npx vitest run src/components/marketing` → all pass. `npm run build` → succeeds. `npm run lint` → clean.

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: animated constellation Hero component + hero CSS + i18n"
```

---

### Task 3: Mount hero on home + e2e + full verification

**Files:**
- Modify: `src/app/[locale]/page.tsx` (replace the plain hero section)
- Test: `e2e/hero.spec.ts`

**Interfaces:** Consumes `Hero` (Task 2).

- [ ] **Step 1: Mount the Hero**

In `src/app/[locale]/page.tsx`: add `import { Hero } from '@/components/marketing/Hero';`. Replace the existing hero block

```tsx
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-ink">{t('heroTitle')}</h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-muted">{t('heroBody')}</p>
        <Link href="/services" className="mt-8 inline-block rounded-md bg-primary px-6 py-3 font-bold text-on-primary">
          {t('heroCta')} &gt;
        </Link>
      </section>
```

with

```tsx
      <Hero
        kicker={t('heroKicker')}
        title={t('heroTitle')}
        titleAccent={t('heroTitleAccent')}
        body={t('heroBody')}
        cta={t('heroCta')}
        cta2={t('heroCta2')}
      />
```

(Leave the rest of the page — `<TechMarquee/>`, etc. — unchanged. The `Link` import may now be unused on this page; if lint flags it, remove the `Link` import from `page.tsx`.)

- [ ] **Step 2: Write the hero e2e**

Create `e2e/hero.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('home hero renders headline + both CTAs (EN)', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1, name: /Let us Be your Intelligent Solution\./i })).toBeVisible();
  await expect(page.getByRole('link', { name: /See how we do it/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Book a free assessment/i })).toBeVisible();
});

test('home hero renders localized headline (ES)', async ({ page }) => {
  await page.goto('/es');
  await expect(page.getByRole('heading', { level: 1, name: /Deja que seamos tu Solución Inteligente\./i })).toBeVisible();
});
```

- [ ] **Step 3: Full verification**

Run parity (Task 2 Step 8 command) → `equal true`.
Run: `npx vitest run` → all pass (the pre-existing `resend.test.ts` may flake only under full-suite parallelism — confirm it passes in isolation via `npx vitest run src/lib/email` if it appears). `npm run build` → succeeds; `/[locale]` prerenders. `npm run lint` → clean.
Run: `npm run e2e -- hero` → 2 passed. (If port 3000 is held by another local project, identify it via `netstat -ano | grep :3000` + `powershell "(Get-CimInstance Win32_Process -Filter 'ProcessId=<pid>').CommandLine"`; if it is NOT this BIS project, free it with `taskkill //PID <pid> //F` and re-run. If the run flakes on first-navigation compile, re-run once against a warm server or note it — do not weaken the test.)
**Manual visual pass** (report what you can; the controller/owner does the final eyeball): confirm the build output and that no `text-blue`/hardcoded old colors remain; note that a full light+dark visual sweep across all 6 pages is an owner check.

- [ ] **Step 4: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: mount animated Hero on the home page + hero e2e"
```

---

## Self-review notes (addressed)

- **Spec coverage:** palette tokens both modes + gold→accent + grep gate (Task 1); AA-verify step (Task 1 Step 4); Hero client component with capped/DPR/offscreen-paused/reduced-motion canvas + gradient headline + two CTAs + entrance + aria-hidden canvas (Task 2); i18n kicker/accent/cta2 + parity (Task 2); mount replacing plain hero + e2e (Task 3); dark-first is inherent (tokens). All spec sections map to a task.
- **Async/client boundary:** `Hero` is a client island; the home page stays a server component and passes resolved i18n strings as props (so no `getTranslations` inside the client component).
- **Headline accessibility preserved:** `{title} <span>{titleAccent}</span>` yields the accessible name "Let us Be your Intelligent Solution." — so the existing `home.spec.ts` heading assertion and the new hero e2e both match.
- **Canvas testability:** jsdom returns `null` from `getContext`, so the effect bails before touching `IntersectionObserver`/rAF; the test mocks `getContext`→null to keep output pristine. Native matchers only.
- **Type consistency:** `Hero` prop shape defined in Task 2 and consumed identically in Task 3.
- **No-placeholder note:** the reduced-motion + offscreen-pause behavior is real code in Task 2, not a description.
