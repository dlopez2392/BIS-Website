# Calendar Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an inline Cal.com self-scheduling section below the contact form so prospects can book the free assessment call directly.

**Architecture:** One client component `BookingEmbed` (using `@calcom/embed-react`) renders the inline Cal.com scheduler for an env-configured booking link, matches the page locale + light/dark theme, and always includes a plain fallback link. It's mounted in a new "Book a call" section on the existing Contact page. Cal.com owns the calendar; nothing is stored in our DB.

**Tech Stack:** Next.js 16.2 App Router · next-intl v4 · next-themes · `@calcom/embed-react` · Vitest + Playwright.

## Global Constraints

- Work from repo root `C:\Users\danlo\BIS-Website`. Node 24, npm.
- Every new user-facing string lives in `messages/en.json` + `messages/es.json` `contact` namespace, identical key sets (next-intl throws on a missing key).
- Booking link comes from env `NEXT_PUBLIC_CALCOM_LINK`; code default (dev/placeholder) is `dan-lopez/assessment`. Cal.com owns bookings — do NOT store them in Neon.
- `BookingEmbed` is a client component; it must render a fallback anchor to `https://cal.com/<link>` and must not throw in jsdom tests (the Cal embed is mocked in tests).
- Section goes BELOW the existing form on `/contact`; do not remove or restructure the form.
- Commit with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit`.
- Repo note: `AGENTS.md` warns Next 16.2 may differ from training data — consult `node_modules/next/dist/docs/` if a Next API misbehaves; consult `node_modules/@calcom/embed-react` if the embed API differs from this plan.

---

### Task 1: Cal.com booking section on the Contact page

**Files:**
- Modify: `package.json` (add `@calcom/embed-react`)
- Create: `src/components/contact/BookingEmbed.tsx`
- Modify: `src/app/[locale]/contact/page.tsx` (add the "Book a call" section)
- Modify: `messages/en.json`, `messages/es.json` (`contact`: `bookHeading`, `bookSubtext`, `bookFallback`)
- Test: `src/components/contact/__tests__/BookingEmbed.test.tsx`, `e2e/booking.spec.ts`

**Interfaces:**
- Produces: `<BookingEmbed />` from `@/components/contact/BookingEmbed` — an inline Cal.com scheduler + a fallback anchor to `https://cal.com/${NEXT_PUBLIC_CALCOM_LINK ?? 'dan-lopez/assessment'}`.

- [ ] **Step 1: Install the embed dependency**

```bash
cd "C:/Users/danlo/BIS-Website"
npm install @calcom/embed-react
```

- [ ] **Step 2: Add the copy (EN)**

In `messages/en.json` `contact`, add:

```json
"bookHeading": "Prefer to talk? Book a call.",
"bookSubtext": "Grab a free 20-minute assessment slot that works for you — no pitch, just a look at where AI or automation can help your business.",
"bookFallback": "Open the booking page"
```

- [ ] **Step 3: Add the copy (ES)**

In `messages/es.json` `contact`, add:

```json
"bookHeading": "¿Prefieres hablar? Agenda una llamada.",
"bookSubtext": "Reserva un espacio gratuito de 20 minutos que te funcione — sin presión de venta, solo un vistazo a dónde la IA o la automatización pueden ayudar a tu negocio.",
"bookFallback": "Abrir la página de reservación"
```

- [ ] **Step 4: Write the failing component test**

Create `src/components/contact/__tests__/BookingEmbed.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@calcom/embed-react', () => ({
  __esModule: true,
  default: () => <div data-testid="cal-embed" />,
  getCalApi: async () => () => {},
}));
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }));

import { BookingEmbed } from '../BookingEmbed';

const messages = { contact: {
  bookHeading: 'Prefer to talk? Book a call.',
  bookSubtext: 'Grab a free 20-minute assessment slot.',
  bookFallback: 'Open the booking page',
} };

describe('BookingEmbed', () => {
  it('renders the embed and a fallback link to the Cal.com page', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <BookingEmbed />
      </NextIntlClientProvider>
    );
    expect(screen.getByTestId('cal-embed')).toBeTruthy();
    const link = screen.getByRole('link', { name: /Open the booking page/i });
    expect(link.getAttribute('href')).toBe('https://cal.com/dan-lopez/assessment');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test -- BookingEmbed`
Expected: FAIL — cannot resolve `../BookingEmbed`.

- [ ] **Step 6: Implement BookingEmbed**

Create `src/components/contact/BookingEmbed.tsx`:

```tsx
'use client';
import { useEffect } from 'react';
import Cal, { getCalApi } from '@calcom/embed-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

const CAL_LINK = process.env.NEXT_PUBLIC_CALCOM_LINK ?? 'dan-lopez/assessment';

export function BookingEmbed() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal('ui', { theme, hideEventTypeDetails: false, layout: 'month_view' });
    })();
  }, [theme]);

  return (
    <div>
      <Cal
        calLink={CAL_LINK}
        style={{ width: '100%', height: '600px', overflow: 'scroll' }}
        config={{ layout: 'month_view', theme, language: locale }}
      />
      <a
        href={`https://cal.com/${CAL_LINK}`}
        className="mt-3 inline-block text-sm font-bold text-primary"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('bookFallback')} &gt;
      </a>
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- BookingEmbed`
Expected: PASS.

- [ ] **Step 8: Add the "Book a call" section to the Contact page**

In `src/app/[locale]/contact/page.tsx`, import the component at the top:

```tsx
import { BookingEmbed } from '@/components/contact/BookingEmbed';
```

Then, INSIDE the page's `<main>`, AFTER the existing form/grid block and before `</main>`, add a new section (uses the existing `t` = `getTranslations('contact')`):

```tsx
      <section className="mt-20 border-t border-hairline pt-16">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink">{t('bookHeading')}</h2>
        <p className="mt-3 max-w-2xl text-ink-muted">{t('bookSubtext')}</p>
        <div className="mt-8">
          <BookingEmbed />
        </div>
      </section>
```

(Keep the existing form section unchanged.)

- [ ] **Step 9: Write + run the booking e2e**

Create `e2e/booking.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('contact page shows the booking section and fallback link', async ({ page }) => {
  await page.goto('/en/contact');
  await expect(page.getByRole('heading', { name: /Prefer to talk\? Book a call/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open the booking page/i })).toHaveAttribute(
    'href', /cal\.com\//
  );
});
```

Run: `npm run e2e -- booking`
Expected: 1 passed. (If the Cal embed script logs console noise or is slow, the assertions target the heading + fallback link, which render server-side regardless of the external embed.)

- [ ] **Step 10: Verify parity, build, commit**

Run: `node -e "const a=require('./messages/en.json'),b=require('./messages/es.json');const k=o=>Object.entries(o).flatMap(([n,v])=>Object.keys(v).map(x=>n+'.'+x)).sort();console.log('equal',JSON.stringify(k(a))===JSON.stringify(k(b)));"` → `equal true`.
Run: `npm test` → all pass. `npm run build` → succeeds. `npm run lint` → clean.
Run: `npm run e2e -- booking` → passes.

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: cal.com booking section on the contact page (bilingual, theme-aware, fallback)"
```

---

## Self-review notes (addressed)
- **Spec coverage:** BookingEmbed with env link + locale + theme + fallback (Steps 1,6); Contact-page section below the form (Step 8); bilingual copy (Steps 2-3); tests incl. fallback assertion + e2e (Steps 4,9); no DB storage (nothing added to the contact pipeline). Owner setup (Cal.com account) is off-code.
- **No live embed in tests:** `@calcom/embed-react` and `next-themes` are mocked; the test asserts the fallback link + a stubbed embed.
- **Placeholder note:** `NEXT_PUBLIC_CALCOM_LINK` default `dan-lopez/assessment` is a documented config value, replaced by Dan's real link via Vercel env — not a plan gap.

## Post-implementation (owner actions, not code)
- Create the Cal.com account + "Free Assessment" event; connect a calendar.
- Set `NEXT_PUBLIC_CALCOM_LINK` in Vercel (Production) to the real `username/event-slug`; redeploy.
- Book a real test slot to confirm the flow end-to-end.
