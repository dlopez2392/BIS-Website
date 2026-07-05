# BIS Website — Phase 1: Foundation + Core Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployable, fully bilingual (EN/ES) Next.js marketing site for Bespoke Intelligent Solutions with the 5 core pages, the ported Stitch design system, and light/dark mode — contact form is UI-only (backend is Phase 2).

**Architecture:** Next.js App Router with a `[locale]` route segment. `next-intl` v4 supplies locale routing + message catalogs; all copy lives in `messages/en.json` and `messages/es.json`. `next-themes` drives class-based dark mode. Tailwind v4 CSS-first theme ports the Stitch tokens. Pages are composed from small, focused, server-rendered React components; the contact form and interactive toggles are the only client components.

**Tech Stack:** Next.js 16.2 · React 19 · TypeScript · Tailwind CSS v4 · next-intl 4.13 · next-themes 0.4 · lucide-react · Vitest + React Testing Library + jsdom · Playwright.

## Global Constraints

- Node 24, npm. All commands run from repo root `C:\Users\danlo\BIS-Website`.
- Every user-facing string comes from `messages/{en,es}.json` via `useTranslations` / `getTranslations` — **no hardcoded copy in components**. Both locales must have every key.
- `locales = ['en', 'es']`, `defaultLocale = 'en'`. All routes are locale-prefixed (`/en/...`, `/es/...`).
- Brand wordmark renders as `bis>` (lowercase, trailing `>`); full name "Bespoke Intelligent Solutions".
- Design tokens are the Stitch palette: primary `#2745e0`, metallic-gold `#C9A227`, light background `#f9f9f9`, ink `#1b1b1b`. Body/headline font: **Hanken Grotesk**.
- Content-cleanup rule (from spec §8): no fabricated metrics. The Home "stats band" uses capability statements, not invented numbers. Year is **2026**. One contact email placeholder: `hello@bespokeintelligent.com` (final domain TBD).
- Dark mode via `class` strategy (`next-themes`), matching Stitch `darkMode: "class"`.
- Commit after every task with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit`.
- Reference material (not shipped): Stitch page text at `%TEMP%\claude\...\scratchpad\text_*.txt`, full HTML at `stitch_*.html`.

---

### Task 1: Scaffold project + testing infrastructure

**Files:**
- Create: whole Next.js app in repo root (via `create-next-app`)
- Create: `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`
- Create: `src/app/[locale]/` (App Router base created in later tasks; scaffolding here)
- Test: `src/lib/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: a runnable Next.js app (`npm run dev`), `npm test` (Vitest), `npm run e2e` (Playwright).

- [ ] **Step 1: Scaffold into the existing empty repo**

The repo already exists (cloned, contains only `docs/` + `.git`). Scaffold in place:

```bash
cd "C:/Users/danlo/BIS-Website"
npx --yes create-next-app@16.2.10 . \
  --ts --app --tailwind --eslint --src-dir \
  --import-alias "@/*" --no-turbopack --use-npm --yes
```

If it refuses because the directory is non-empty, scaffold in a temp dir and copy over:

```bash
npx --yes create-next-app@16.2.10 ../bis-scaffold --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --no-turbopack --use-npm --yes
cp -r ../bis-scaffold/. ./
rm -rf ../bis-scaffold
```

- [ ] **Step 2: Install runtime + test dependencies**

```bash
npm install next-intl@4.13.1 next-themes@0.4.6 lucide-react zod react-hook-form @hookform/resolvers
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event @playwright/test
npx playwright install chromium
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

Create `vitest.setup.ts`:

```ts
import '@testing-library/react';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(() => cleanup());
```

Create `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI, timeout: 120_000 },
  use: { baseURL: 'http://localhost:3000' },
});
```

- [ ] **Step 4: Add scripts to `package.json`**

In `package.json` `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest",
"e2e": "playwright test"
```

- [ ] **Step 5: Write the failing smoke test**

Create `src/lib/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/cn';

describe('cn', () => {
  it('joins truthy class names and skips falsy ones', () => {
    expect(cn('a', false, 'b', undefined, 'c')).toBe('a b c');
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/cn`.

- [ ] **Step 7: Implement the util**

Create `src/lib/cn.ts`:

```ts
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
```

- [ ] **Step 8: Run tests to verify pass**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 9: Add `.gitignore` entries + commit**

Ensure `.gitignore` includes `node_modules`, `.next`, `test-results`, `playwright-report`, `.env*` (create-next-app adds most). Then:

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "chore: scaffold Next.js app with Vitest and Playwright"
```

---

### Task 2: Port the Stitch design system (Tailwind theme, fonts, dark mode)

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/lib/fonts.ts`
- Create: `src/components/theme/ThemeProvider.tsx`
- Create: `src/components/theme/ThemeToggle.tsx`
- Test: `src/components/theme/__tests__/ThemeToggle.test.tsx`

**Interfaces:**
- Produces: `hankenGrotesk` (next/font instance, exposes `.variable`), `<ThemeProvider>`, `<ThemeToggle />`. Tailwind utilities `bg-primary`, `text-ink`, `bg-surface`, `text-gold`, dark variants via `.dark` class.

- [ ] **Step 1: Load the brand font**

Create `src/lib/fonts.ts`:

```ts
import { Hanken_Grotesk } from 'next/font/google';

export const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-hanken',
  display: 'swap',
});
```

- [ ] **Step 2: Write the Tailwind v4 theme (ported Stitch tokens)**

Replace `src/app/globals.css` with:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --color-surface: #f9f9f9;
  --color-surface-alt: #ffffff;
  --color-ink: #1b1b1b;
  --color-ink-muted: #444655;
  --color-primary: #2745e0;
  --color-on-primary: #ffffff;
  --color-gold: #c9a227;
  --color-hairline: #e5e5e5;
}

.dark {
  --color-surface: #141414;
  --color-surface-alt: #1e1e1e;
  --color-ink: #f1f1f1;
  --color-ink-muted: #b8bac6;
  --color-primary: #4864ff;
  --color-on-primary: #000f5d;
  --color-gold: #d8b647;
  --color-hairline: #2c2c2c;
}

@theme inline {
  --color-surface: var(--color-surface);
  --color-surface-alt: var(--color-surface-alt);
  --color-ink: var(--color-ink);
  --color-ink-muted: var(--color-ink-muted);
  --color-primary: var(--color-primary);
  --color-on-primary: var(--color-on-primary);
  --color-gold: var(--color-gold);
  --color-hairline: var(--color-hairline);
  --font-sans: var(--font-hanken), system-ui, sans-serif;
}

body {
  background: var(--color-surface);
  color: var(--color-ink);
  font-family: var(--font-sans);
}
```

- [ ] **Step 3: Create the theme provider**

Create `src/components/theme/ThemeProvider.tsx`:

```tsx
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 4: Write the failing ThemeToggle test**

Create `src/components/theme/__tests__/ThemeToggle.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
  it('renders an accessible theme toggle button', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeTruthy();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test -- ThemeToggle`
Expected: FAIL — cannot resolve `../ThemeToggle`.

- [ ] **Step 6: Implement ThemeToggle**

Create `src/components/theme/ThemeToggle.tsx`:

```tsx
'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-ink hover:bg-surface-alt"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
```

- [ ] **Step 7: Run tests to verify pass**

Run: `npm test -- ThemeToggle`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: port Stitch design tokens, Hanken Grotesk, dark mode"
```

---

### Task 3: i18n foundation (next-intl v4 routing + base messages)

**Files:**
- Create: `src/i18n/routing.ts`, `src/i18n/navigation.ts`, `src/i18n/request.ts`
- Create: `src/middleware.ts`
- Modify: `next.config.ts`
- Create: `src/app/[locale]/layout.tsx`
- Modify: delete `src/app/page.tsx` and `src/app/layout.tsx` (replaced by locale segment)
- Create: `messages/en.json`, `messages/es.json` (base namespaces: `common`, `nav`)
- Test: `e2e/i18n.spec.ts`

**Interfaces:**
- Produces: `routing` (locales `['en','es']`, default `en`), `Link`, `usePathname`, `getPathname` from `@/i18n/navigation`, request config for `getTranslations`. Root layout at `[locale]/layout.tsx` wraps children in `NextIntlClientProvider` + `ThemeProvider` and applies `hankenGrotesk.variable`.

- [ ] **Step 1: Define routing**

Create `src/i18n/routing.ts`:

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
});
```

Create `src/i18n/navigation.ts`:

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 2: Request config + middleware**

Create `src/i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});
```

Create `src/middleware.ts`:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(en|es)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

- [ ] **Step 3: Wire the plugin in `next.config.ts`**

Replace `next.config.ts` with:

```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = {};
export default withNextIntl(nextConfig);
```

- [ ] **Step 4: Base message catalogs**

Create `messages/en.json`:

```json
{
  "common": {
    "brand": "bis>",
    "fullName": "Bespoke Intelligent Solutions",
    "cta": "Book your assessment",
    "learnMore": "Learn more"
  },
  "nav": {
    "home": "Home",
    "services": "Services",
    "industries": "Industries",
    "about": "About",
    "contact": "Contact"
  }
}
```

Create `messages/es.json`:

```json
{
  "common": {
    "brand": "bis>",
    "fullName": "Bespoke Intelligent Solutions",
    "cta": "Reserva tu evaluación",
    "learnMore": "Más información"
  },
  "nav": {
    "home": "Inicio",
    "services": "Servicios",
    "industries": "Industrias",
    "about": "Nosotros",
    "contact": "Contacto"
  }
}
```

- [ ] **Step 5: Replace root layout with locale layout**

Delete `src/app/page.tsx`, `src/app/layout.tsx`. Create `src/app/[locale]/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { hankenGrotesk } from '@/lib/fonts';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning className={hankenGrotesk.variable}>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Temporary home page to prove routing**

Create `src/app/[locale]/page.tsx`:

```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  return <main data-testid="home"><h1>{t('home')}</h1></main>;
}
```

- [ ] **Step 7: Write the failing e2e i18n test**

Create `e2e/i18n.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('serves English at /en', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
});

test('serves Spanish at /es', async ({ page }) => {
  await page.goto('/es');
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
});

test('redirects bare / to default locale', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
});
```

- [ ] **Step 8: Run e2e to verify pass**

Run: `npm run e2e -- i18n`
Expected: 3 passed. (If it fails first for a missing piece, fix per error, then rerun.)

- [ ] **Step 9: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: next-intl locale routing with en/es and base messages"
```

---

### Task 4: Shared chrome — Header + Footer

**Files:**
- Create: `src/components/layout/Header.tsx`, `src/components/layout/LocaleSwitcher.tsx`, `src/components/layout/Footer.tsx`
- Modify: `src/app/[locale]/layout.tsx` (mount Header/Footer)
- Modify: `messages/en.json`, `messages/es.json` (add `footer` namespace)
- Test: `src/components/layout/__tests__/LocaleSwitcher.test.tsx`, `e2e/nav.spec.ts`

**Interfaces:**
- Consumes: `Link`, `usePathname` from `@/i18n/navigation`; `useTranslations` from `next-intl`.
- Produces: `<Header />`, `<Footer />` mounted for all pages. Nav links go to `/`, `/services`, `/industries`, `/about`, `/contact`. `<LocaleSwitcher />` toggles EN|ES preserving the current path.

- [ ] **Step 1: Add footer messages**

In `messages/en.json` add:

```json
"footer": {
  "tagline": "Your Intelligent Solution",
  "expertise": "Expertise",
  "company": "Company",
  "location": "Location",
  "contactCol": "Contact",
  "aiStrategy": "AI Strategy",
  "infrastructure": "Infrastructure",
  "webDev": "Web Development",
  "methodology": "Methodology",
  "caseStudies": "Case Studies",
  "privacy": "Privacy Policy",
  "region": "Rio Grande Valley",
  "city": "Harlingen, TX",
  "email": "hello@bespokeintelligent.com",
  "rights": "© 2026 bis. All rights reserved."
}
```

In `messages/es.json` add:

```json
"footer": {
  "tagline": "Tu Solución Inteligente",
  "expertise": "Especialidades",
  "company": "Empresa",
  "location": "Ubicación",
  "contactCol": "Contacto",
  "aiStrategy": "Estrategia de IA",
  "infrastructure": "Infraestructura",
  "webDev": "Desarrollo Web",
  "methodology": "Metodología",
  "caseStudies": "Casos de Éxito",
  "privacy": "Política de Privacidad",
  "region": "Valle del Río Grande",
  "city": "Harlingen, TX",
  "email": "hello@bespokeintelligent.com",
  "rights": "© 2026 bis. Todos los derechos reservados."
}
```

- [ ] **Step 2: Write the failing LocaleSwitcher test**

Create `src/components/layout/__tests__/LocaleSwitcher.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LocaleSwitcher } from '../LocaleSwitcher';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/services',
  Link: ({ children, ...p }: any) => <a {...p}>{children}</a>,
}));

describe('LocaleSwitcher', () => {
  it('offers both EN and ES links', () => {
    render(
      <NextIntlClientProvider locale="en" messages={{}}>
        <LocaleSwitcher />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('link', { name: 'EN' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'ES' })).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- LocaleSwitcher`
Expected: FAIL — cannot resolve `../LocaleSwitcher`.

- [ ] **Step 4: Implement LocaleSwitcher**

Create `src/components/layout/LocaleSwitcher.tsx`:

```tsx
'use client';
import { useLocale } from 'next-intl';
import { usePathname, Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

const LOCALES = ['en', 'es'] as const;

export function LocaleSwitcher() {
  const active = useLocale();
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 text-sm font-bold">
      {LOCALES.map((loc, i) => (
        <span key={loc} className="flex items-center gap-1">
          {i > 0 && <span className="text-hairline">|</span>}
          <Link
            href={pathname}
            locale={loc}
            className={cn('uppercase', loc === active ? 'text-primary' : 'text-ink-muted hover:text-ink')}
          >
            {loc}
          </Link>
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify pass**

Run: `npm test -- LocaleSwitcher`
Expected: PASS.

- [ ] **Step 6: Implement Header**

Create `src/components/layout/Header.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function Header() {
  const t = useTranslations('nav');
  const items = [
    { href: '/', label: t('home') },
    { href: '/services', label: t('services') },
    { href: '/industries', label: t('industries') },
    { href: '/about', label: t('about') },
    { href: '/contact', label: t('contact') },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-extrabold tracking-tight text-ink">bis&gt;</Link>
        <nav className="hidden items-center gap-6 md:flex">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="text-sm text-ink-muted hover:text-ink">
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 7: Implement Footer**

Create `src/components/layout/Footer.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="border-t border-hairline bg-surface-alt">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="font-extrabold text-ink">bis&gt;</p>
          <p className="mt-2 text-sm text-ink-muted">{t('tagline')}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-ink-muted">{t('expertise')}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>{t('aiStrategy')}</li><li>{t('infrastructure')}</li><li>{t('webDev')}</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-ink-muted">{t('company')}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>{t('methodology')}</li><li>{t('caseStudies')}</li>
            <li><Link href="/contact">{t('contactCol')}</Link></li>
            <li>{t('privacy')}</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-ink-muted">{t('location')}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>{t('city')}</li><li>{t('region')}</li>
            <li><a href={`mailto:${t('email')}`} className="text-primary">{t('email')}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-hairline py-4 text-center text-xs text-ink-muted">{t('rights')}</div>
    </footer>
  );
}
```

- [ ] **Step 8: Mount Header/Footer in the locale layout**

In `src/app/[locale]/layout.tsx`, import them and wrap children:

```tsx
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
// ...inside NextIntlClientProvider:
<NextIntlClientProvider>
  <Header />
  {children}
  <Footer />
</NextIntlClientProvider>
```

- [ ] **Step 9: Write + run the nav e2e**

Create `e2e/nav.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('nav links to Services and locale switch preserves path', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('link', { name: 'Services' }).click();
  await expect(page).toHaveURL(/\/en\/services$/);
  await page.getByRole('link', { name: 'ES' }).click();
  await expect(page).toHaveURL(/\/es\/services$/);
});
```

Run: `npm run e2e -- nav`
Expected: 1 passed.

- [ ] **Step 10: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: shared Header/Footer with locale + theme switchers"
```

---

### Task 5: Home page

**Files:**
- Create: `src/components/ui/SectionHeading.tsx`, `src/components/ui/CTASection.tsx`, `src/components/marketing/ServiceCard.tsx`, `src/components/marketing/CapabilityBand.tsx`
- Modify: `src/app/[locale]/page.tsx` (real home)
- Modify: `messages/en.json`, `messages/es.json` (add `home` namespace)
- Test: `src/components/marketing/__tests__/ServiceCard.test.tsx`, `e2e/home.spec.ts`

**Interfaces:**
- Consumes: `useTranslations`, `Link`.
- Produces: `<SectionHeading title eyebrow?>`, `<CTASection>`, `<ServiceCard icon title body href>`, `<CapabilityBand items>`. Home renders hero, capability band, 3 service cards, founder quote, CTA.

- [ ] **Step 1: Add `home` messages (EN)**

In `messages/en.json` add:

```json
"home": {
  "heroTitle": "Let us Be your Intelligent Solution.",
  "heroBody": "Across the Rio Grande Valley, we help businesses work smarter with AI, secure infrastructure, and human ingenuity — in English y en español.",
  "heroCta": "See how we do it",
  "announceKicker": "Now Open",
  "announceTitle": "BIS is open in the Rio Grande Valley to help local businesses harness AI.",
  "announceBody": "Enterprise-grade AI adoption, security modernization, and modern web design — right-sized for the businesses that keep the Valley running, through one point of contact.",
  "capabilities": "What sets us apart",
  "capOnePoint": "One point of contact",
  "capBilingual": "Fully bilingual, EN/ES",
  "capSecurity": "Enterprise-grade security",
  "capShip": "AI that ships to production",
  "servicesHeading": "Intelligent Services",
  "svc1Title": "AI Strategy & Adoption",
  "svc1Body": "We identify the workflows where AI can save you the most time, then build the custom tools to automate them.",
  "svc2Title": "Secure Infrastructure",
  "svc2Body": "Enterprise-grade security and cloud systems designed for the scale of high-growth Valley enterprises.",
  "svc3Title": "Modern Digital Presence",
  "svc3Body": "High-performance web applications that convert and communicate in both of our region's languages.",
  "quote": "Big-firm technology has never been out of reach for Valley businesses — it's just never been built for them. Bespoke means we start with your workflow, your customers, your two languages.",
  "quoteName": "Dan Lopez",
  "quoteRole": "Founder, BIS",
  "ctaTitle": "Let's find your first hour back.",
  "ctaBody": "A free, no-pitch assessment: we look at how your business runs today and show you the one automation that pays for itself first."
}
```

- [ ] **Step 2: Add `home` messages (ES)**

In `messages/es.json` add:

```json
"home": {
  "heroTitle": "Deja que seamos tu Solución Inteligente.",
  "heroBody": "En todo el Valle del Río Grande, ayudamos a los negocios a trabajar de forma más inteligente con IA, infraestructura segura e ingenio humano — in English y en español.",
  "heroCta": "Descubre cómo lo hacemos",
  "announceKicker": "Ya Abiertos",
  "announceTitle": "BIS ya está en el Valle del Río Grande para ayudar a los negocios locales a aprovechar la IA.",
  "announceBody": "Adopción de IA de nivel empresarial, modernización de seguridad y diseño web moderno — a la medida de los negocios que hacen funcionar el Valle, a través de un solo punto de contacto.",
  "capabilities": "Lo que nos distingue",
  "capOnePoint": "Un solo punto de contacto",
  "capBilingual": "Totalmente bilingüe, EN/ES",
  "capSecurity": "Seguridad de nivel empresarial",
  "capShip": "IA que llega a producción",
  "servicesHeading": "Servicios Inteligentes",
  "svc1Title": "Estrategia y Adopción de IA",
  "svc1Body": "Identificamos los flujos de trabajo donde la IA puede ahorrarte más tiempo, y construimos las herramientas a la medida para automatizarlos.",
  "svc2Title": "Infraestructura Segura",
  "svc2Body": "Sistemas de seguridad y nube de nivel empresarial, diseñados para la escala de las empresas del Valle en pleno crecimiento.",
  "svc3Title": "Presencia Digital Moderna",
  "svc3Body": "Aplicaciones web de alto rendimiento que convierten y comunican en los dos idiomas de nuestra región.",
  "quote": "La tecnología de las grandes firmas nunca ha estado fuera del alcance de los negocios del Valle — simplemente nunca se construyó para ellos. Bespoke significa que empezamos con tu flujo de trabajo, tus clientes, tus dos idiomas.",
  "quoteName": "Dan Lopez",
  "quoteRole": "Fundador, BIS",
  "ctaTitle": "Encontremos tu primera hora recuperada.",
  "ctaBody": "Una evaluación gratuita y sin presión de venta: analizamos cómo funciona tu negocio hoy y te mostramos la primera automatización que se paga sola."
}
```

- [ ] **Step 3: Shared UI primitives**

Create `src/components/ui/SectionHeading.tsx`:

```tsx
export function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-10">
      {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gold">{eyebrow}</p>}
      <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h2>
    </div>
  );
}
```

Create `src/components/ui/CTASection.tsx`:

```tsx
import { Link } from '@/i18n/navigation';

export function CTASection({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <section className="bg-primary text-on-primary">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl opacity-90">{body}</p>
        <Link href="/contact" className="mt-8 inline-block rounded-md bg-on-primary px-6 py-3 font-bold text-primary hover:opacity-90">
          {cta} &gt;
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write the failing ServiceCard test**

Create `src/components/marketing/__tests__/ServiceCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Brain } from 'lucide-react';
import { ServiceCard } from '../ServiceCard';

vi.mock('@/i18n/navigation', () => ({ Link: ({ children, ...p }: any) => <a {...p}>{children}</a> }));

describe('ServiceCard', () => {
  it('renders title, body and a learn-more link', () => {
    render(<ServiceCard icon={Brain} title="AI Strategy" body="We automate." href="/services" learnMore="Learn more" />);
    expect(screen.getByRole('heading', { name: 'AI Strategy' })).toBeTruthy();
    expect(screen.getByText('We automate.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /learn more/i })).toBeTruthy();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test -- ServiceCard`
Expected: FAIL — cannot resolve `../ServiceCard`.

- [ ] **Step 6: Implement ServiceCard + CapabilityBand**

Create `src/components/marketing/ServiceCard.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function ServiceCard({
  icon: Icon, title, body, href, learnMore,
}: { icon: LucideIcon; title: string; body: string; href: string; learnMore: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-alt p-6">
      <Icon className="text-primary" size={28} />
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
      <Link href={href} className="mt-4 inline-block text-sm font-bold text-primary">{learnMore} &gt;</Link>
    </div>
  );
}
```

Create `src/components/marketing/CapabilityBand.tsx`:

```tsx
export function CapabilityBand({ items }: { items: string[] }) {
  return (
    <section className="border-y border-hairline bg-surface-alt">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-2 md:grid-cols-4">
        {items.map((it) => (
          <div key={it} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-gold" />
            <span className="text-sm font-medium text-ink">{it}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Run test to verify pass**

Run: `npm test -- ServiceCard`
Expected: PASS.

- [ ] **Step 8: Build the Home page**

Replace `src/app/[locale]/page.tsx`:

```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Brain, ShieldCheck, Code2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CTASection } from '@/components/ui/CTASection';
import { ServiceCard } from '@/components/marketing/ServiceCard';
import { CapabilityBand } from '@/components/marketing/CapabilityBand';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const c = await getTranslations('common');

  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-ink">{t('heroTitle')}</h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-muted">{t('heroBody')}</p>
        <Link href="/services" className="mt-8 inline-block rounded-md bg-primary px-6 py-3 font-bold text-on-primary">
          {t('heroCta')} &gt;
        </Link>
      </section>

      <CapabilityBand items={[t('capOnePoint'), t('capBilingual'), t('capSecurity'), t('capShip')]} />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading eyebrow={t('announceKicker')} title={t('servicesHeading')} />
        <div className="grid gap-6 md:grid-cols-3">
          <ServiceCard icon={Brain} title={t('svc1Title')} body={t('svc1Body')} href="/services" learnMore={c('learnMore')} />
          <ServiceCard icon={ShieldCheck} title={t('svc2Title')} body={t('svc2Body')} href="/services" learnMore={c('learnMore')} />
          <ServiceCard icon={Code2} title={t('svc3Title')} body={t('svc3Body')} href="/services" learnMore={c('learnMore')} />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <blockquote className="text-2xl font-medium text-ink">“{t('quote')}”</blockquote>
        <p className="mt-4 font-bold text-ink">{t('quoteName')}</p>
        <p className="text-sm text-ink-muted">{t('quoteRole')}</p>
      </section>

      <CTASection title={t('ctaTitle')} body={t('ctaBody')} cta={c('cta')} />
    </main>
  );
}
```

- [ ] **Step 9: Write + run the home e2e**

Create `e2e/home.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('home renders hero in EN and ES', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: /Let us Be your Intelligent Solution/i })).toBeVisible();
  await page.goto('/es');
  await expect(page.getByRole('heading', { name: /Deja que seamos tu Solución Inteligente/i })).toBeVisible();
});
```

Run: `npm run e2e -- home`
Expected: 1 passed.

- [ ] **Step 10: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: home page with hero, services, quote, CTA (EN/ES)"
```

---

### Task 6: Services page

**Files:**
- Create: `src/app/[locale]/services/page.tsx`, `src/components/marketing/ServiceGroup.tsx`
- Modify: `messages/en.json`, `messages/es.json` (add `services` namespace)
- Test: `e2e/services.spec.ts`

**Interfaces:**
- Consumes: `getTranslations`, `t.raw` for bullet arrays.
- Produces: `<ServiceGroup title body proof bullets>`; Services page with 3 groups + CTA.

- [ ] **Step 1: Add `services` messages (EN)**

In `messages/en.json` add:

```json
"services": {
  "title": "What we do.",
  "intro": "Bespoke Intelligent Solutions for the modern enterprise. We bridge the gap between legacy IT and the frontier of AI.",
  "g1Title": "AI & Automation",
  "g1Body": "AI that removes real hours from your week — not demos that gather dust. We build practical, production-ready systems that integrate with your existing workforce.",
  "g1Proof": "Built AI case-intake summarization for a multi-office law firm — viability answers in minutes, not days.",
  "g1Bullets": ["AI readiness assessments", "Workflow automation (Power Automate, Claude API)", "Custom bilingual AI assistants", "Document pipelines", "AI cost governance", "Staff training"],
  "g2Title": "IT Consulting & Security",
  "g2Body": "Twenty years of enterprise IT leadership. We don't just fix problems; we architect resilient environments that allow your firm to scale securely across borders.",
  "g2Proof": "Led cloud-only modernization for a 150-user firm across three offices in two countries.",
  "g2Bullets": ["Microsoft 365 / Cloud (Entra ID, Intune)", "Phishing-resistant MFA", "Endpoint protection (Defender)", "Network modernization", "MSP oversight", "Security incident triage", "MDM"],
  "g3Title": "Website Design",
  "g3Body": "Fast, modern sites you actually own. No proprietary lock-in. No black boxes. Just clean, performant code that drives conversion and represents your brand's intelligence.",
  "g3Proof": "Every build ships with the keys: your hosting, your accounts, your ownership.",
  "g3Bullets": ["Custom design / dev", "Bilingual content architecture (native)", "Local SEO for RGV", "Analytics dashboards (Power BI)", "Clean handoff"],
  "ctaTitle": "Ready to deploy an intelligent solution?",
  "ctaBody": "Start with a free, no-pitch assessment and see the first automation that pays for itself."
}
```

- [ ] **Step 2: Add `services` messages (ES)**

In `messages/es.json` add:

```json
"services": {
  "title": "Qué hacemos.",
  "intro": "Soluciones Inteligentes a la medida para la empresa moderna. Cerramos la brecha entre el IT tradicional y la frontera de la IA.",
  "g1Title": "IA y Automatización",
  "g1Body": "IA que le quita horas reales a tu semana — no demos que juntan polvo. Construimos sistemas prácticos y listos para producción que se integran con tu equipo actual.",
  "g1Proof": "Construimos resúmenes de admisión de casos con IA para un bufete con varias oficinas — respuestas de viabilidad en minutos, no en días.",
  "g1Bullets": ["Evaluaciones de preparación para IA", "Automatización de flujos (Power Automate, Claude API)", "Asistentes de IA bilingües a la medida", "Procesamiento de documentos", "Gobernanza de costos de IA", "Capacitación del personal"],
  "g2Title": "Consultoría IT y Seguridad",
  "g2Body": "Veinte años de liderazgo en IT empresarial. No solo resolvemos problemas; diseñamos entornos resistentes que le permiten a tu firma escalar de forma segura a través de fronteras.",
  "g2Proof": "Dirigimos la modernización totalmente en la nube de una firma de 150 usuarios en tres oficinas y dos países.",
  "g2Bullets": ["Microsoft 365 / Nube (Entra ID, Intune)", "MFA resistente a phishing", "Protección de endpoints (Defender)", "Modernización de red", "Supervisión de MSP", "Respuesta a incidentes de seguridad", "MDM"],
  "g3Title": "Diseño Web",
  "g3Body": "Sitios rápidos y modernos que de verdad son tuyos. Sin ataduras propietarias. Sin cajas negras. Solo código limpio y de alto rendimiento que impulsa conversiones y representa la inteligencia de tu marca.",
  "g3Proof": "Cada proyecto se entrega con las llaves: tu hosting, tus cuentas, tu propiedad.",
  "g3Bullets": ["Diseño / desarrollo a la medida", "Arquitectura de contenido bilingüe (nativa)", "SEO local para el RGV", "Paneles de analítica (Power BI)", "Entrega limpia"],
  "ctaTitle": "¿Listo para desplegar una solución inteligente?",
  "ctaBody": "Empieza con una evaluación gratuita y sin presión de venta, y descubre la primera automatización que se paga sola."
}
```

- [ ] **Step 3: Implement ServiceGroup**

Create `src/components/marketing/ServiceGroup.tsx`:

```tsx
import { Check } from 'lucide-react';

export function ServiceGroup({
  title, body, proof, bullets,
}: { title: string; body: string; proof: string; bullets: string[] }) {
  return (
    <div className="border-t border-hairline py-12">
      <h2 className="text-2xl font-extrabold text-ink">{title}</h2>
      <p className="mt-3 max-w-2xl text-ink-muted">{body}</p>
      <p className="mt-4 max-w-2xl rounded-md bg-surface-alt p-4 text-sm italic text-ink-muted">{proof}</p>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-ink">
            <Check size={16} className="mt-0.5 shrink-0 text-primary" /> {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Build the Services page**

Create `src/app/[locale]/services/page.tsx`:

```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ServiceGroup } from '@/components/marketing/ServiceGroup';
import { CTASection } from '@/components/ui/CTASection';

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('services');
  const c = await getTranslations('common');
  const groups = [
    { title: t('g1Title'), body: t('g1Body'), proof: t('g1Proof'), bullets: t.raw('g1Bullets') as string[] },
    { title: t('g2Title'), body: t('g2Body'), proof: t('g2Proof'), bullets: t.raw('g2Bullets') as string[] },
    { title: t('g3Title'), body: t('g3Body'), proof: t('g3Proof'), bullets: t.raw('g3Bullets') as string[] },
  ];
  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-6">
        <h1 className="text-5xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-12">
        {groups.map((g) => <ServiceGroup key={g.title} {...g} />)}
      </section>
      <CTASection title={t('ctaTitle')} body={t('ctaBody')} cta={c('cta')} />
    </main>
  );
}
```

- [ ] **Step 5: Write + run the services e2e**

Create `e2e/services.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('services lists three groups in ES', async ({ page }) => {
  await page.goto('/es/services');
  await expect(page.getByRole('heading', { name: 'IA y Automatización' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Consultoría IT y Seguridad' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Diseño Web' })).toBeVisible();
});
```

Run: `npm run e2e -- services`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: services page with 3 pillars (EN/ES)"
```

---

### Task 7: Industries page

**Files:**
- Create: `src/app/[locale]/industries/page.tsx`, `src/components/marketing/IndustryCard.tsx`
- Modify: `messages/en.json`, `messages/es.json` (add `industries` namespace)
- Test: `e2e/industries.spec.ts`

**Interfaces:**
- Produces: `<IndustryCard label title body>`; Industries page with 5 cards + CTA.

- [ ] **Step 1: Add `industries` messages (EN)**

```json
"industries": {
  "title": "Built for the Valley.",
  "intro": "High-performance AI engineering tailored specifically for the Rio Grande Valley's economic anchors. Modern systems designed to scale at the speed of the border.",
  "legalLabel": "Legal",
  "legalTitle": "Intake that never sleeps.",
  "legalBody": "AI-driven legal intake screens potential clients 24/7, delivering formatted, prioritized case data before the first cup of coffee.",
  "medLabel": "Medical & Dental",
  "medTitle": "Less admin, more patients.",
  "medBody": "Automate scheduling, reminders, and bilingual patient intake so your staff spends time on care, not paperwork.",
  "logLabel": "Logistics & Freight",
  "logTitle": "A head start on the corridor.",
  "logBody": "Predictive systems and automated documentation keep freight moving across the border at the speed your customers expect.",
  "tradesLabel": "Skilled Trades",
  "tradesTitle": "Quote, schedule, get paid.",
  "tradesBody": "Modern sites and automations that capture leads, book jobs, and follow up — in both languages your customers speak.",
  "agLabel": "Agriculture",
  "agTitle": "Data-driven from field to invoice.",
  "agBody": "Connect operations, inventory, and reporting with practical AI built for the realities of Valley agriculture.",
  "ctaTitle": "Don't see your industry?",
  "ctaBody": "If your business runs on repeatable work, we can probably automate part of it. Let's find out for free."
}
```

- [ ] **Step 2: Add `industries` messages (ES)**

```json
"industries": {
  "title": "Hecho para el Valle.",
  "intro": "Ingeniería de IA de alto rendimiento hecha específicamente para los pilares económicos del Valle del Río Grande. Sistemas modernos diseñados para escalar a la velocidad de la frontera.",
  "legalLabel": "Legal",
  "legalTitle": "Admisión que nunca duerme.",
  "legalBody": "La admisión legal con IA evalúa a posibles clientes las 24 horas, entregando datos de casos formateados y priorizados antes del primer café.",
  "medLabel": "Médico y Dental",
  "medTitle": "Menos administración, más pacientes.",
  "medBody": "Automatiza agendas, recordatorios y la admisión bilingüe de pacientes para que tu equipo dedique el tiempo al cuidado, no al papeleo.",
  "logLabel": "Logística y Transporte",
  "logTitle": "Una ventaja en el corredor.",
  "logBody": "Sistemas predictivos y documentación automatizada mantienen la carga en movimiento a través de la frontera a la velocidad que tus clientes esperan.",
  "tradesLabel": "Oficios Especializados",
  "tradesTitle": "Cotiza, agenda, cobra.",
  "tradesBody": "Sitios modernos y automatizaciones que capturan clientes, agendan trabajos y dan seguimiento — en los dos idiomas que hablan tus clientes.",
  "agLabel": "Agricultura",
  "agTitle": "Con datos, del campo a la factura.",
  "agBody": "Conecta operaciones, inventario y reportes con IA práctica hecha para la realidad de la agricultura del Valle.",
  "ctaTitle": "¿No ves tu industria?",
  "ctaBody": "Si tu negocio funciona con trabajo repetitivo, probablemente podamos automatizar una parte. Averigüémoslo gratis."
}
```

- [ ] **Step 3: Implement IndustryCard**

Create `src/components/marketing/IndustryCard.tsx`:

```tsx
export function IndustryCard({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-alt p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gold">{label}</p>
      <h3 className="mt-3 text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
    </div>
  );
}
```

- [ ] **Step 4: Build the Industries page**

Create `src/app/[locale]/industries/page.tsx`:

```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { IndustryCard } from '@/components/marketing/IndustryCard';
import { CTASection } from '@/components/ui/CTASection';

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('industries');
  const c = await getTranslations('common');
  const cards = [
    { label: t('legalLabel'), title: t('legalTitle'), body: t('legalBody') },
    { label: t('medLabel'), title: t('medTitle'), body: t('medBody') },
    { label: t('logLabel'), title: t('logTitle'), body: t('logBody') },
    { label: t('tradesLabel'), title: t('tradesTitle'), body: t('tradesBody') },
    { label: t('agLabel'), title: t('agTitle'), body: t('agBody') },
  ];
  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((c2) => <IndustryCard key={c2.label} {...c2} />)}
        </div>
      </section>
      <CTASection title={t('ctaTitle')} body={t('ctaBody')} cta={c('cta')} />
    </main>
  );
}
```

- [ ] **Step 5: Write + run the industries e2e**

Create `e2e/industries.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('industries shows five sectors in EN', async ({ page }) => {
  await page.goto('/en/industries');
  for (const label of ['Legal', 'Medical & Dental', 'Logistics & Freight', 'Skilled Trades', 'Agriculture']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
});
```

Run: `npm run e2e -- industries`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: industries page with five RGV sectors (EN/ES)"
```

---

### Task 8: About page

**Files:**
- Create: `src/app/[locale]/about/page.tsx`, `src/components/marketing/CredentialCard.tsx`, `src/components/marketing/MethodStep.tsx`
- Modify: `messages/en.json`, `messages/es.json` (add `about` namespace)
- Test: `e2e/about.spec.ts`

**Interfaces:**
- Produces: `<CredentialCard title body>`, `<MethodStep index title body>`; About page: founder, credentials grid, 4-step methodology, CTA.

- [ ] **Step 1: Add `about` messages (EN)**

```json
"about": {
  "kicker": "Est. 2024 / Harlingen, TX",
  "title": "Who we are.",
  "intro": "Bespoke Intelligent Solutions brings enterprise-grade IT and AI consultancy to the businesses the giants overlook. We serve those who demand Brutal Intelligence and Strategic depth.",
  "founderKicker": "The Founder",
  "founderName": "Dan Lopez",
  "founderQuote": "I built BIS because the gap between enterprise capability and local execution was widening. My mission is to bridge that divide with engineered precision.",
  "founderBio": "Dan Lopez is the architect behind Bespoke Intelligent Solutions. With a career forged in high-stakes global IT leadership, Dan returned to his roots in Harlingen with a singular vision: to bring sophisticated, enterprise-grade AI and IT consultancy to markets the giants overlook. His approach isn't one-size-fits-all — it's the 'Bespoke': a custom strategy that respects the unique DNA of every organization he partners with.",
  "credKicker": "Technical Depth & Credentials",
  "cred1Title": "20+ Years IT Leadership",
  "cred1Body": "Two decades navigating complex technological shifts at the highest levels.",
  "cred2Title": "Cross-Border Operations",
  "cred2Body": "Multi-office logistics and architecture for global operations.",
  "cred3Title": "Microsoft 365 Expert",
  "cred3Body": "Advanced architecture for M365 ecosystems and security.",
  "cred4Title": "Security Depth",
  "cred4Body": "Deployment of Defender, Fortinet, and advanced threat protection.",
  "cred5Title": "AI Builder",
  "cred5Body": "Specializing in Claude integration and Power Automate workflows.",
  "cred6Title": "Salesforce / Legal-Tech",
  "cred6Body": "Optimizing platforms for legal compliance and high-performance CRM.",
  "cred7Title": "Fully Bilingual",
  "cred7Body": "Fluent execution in English and Spanish for global reach.",
  "cred8Title": "Rooted in Harlingen",
  "cred8Body": "World-class experience with deep local commitment.",
  "methodKicker": "The Methodology",
  "m1Title": "Assess",
  "m1Body": "We map your current architecture to find the friction points and hidden opportunities for AI leverage.",
  "m2Title": "Sequence",
  "m2Body": "Strategy is a game of order. We map the deployment sequence for maximum ROI and minimum disruption.",
  "m3Title": "Build",
  "m3Body": "Execution is precision. We develop custom integrations and AI workflows tailored to your operational DNA.",
  "m4Title": "Hand off",
  "m4Body": "We empower your team to own the solution: documentation, training, and a sustainable roadmap for growth.",
  "ctaTitle": "Let's build your intelligent solution.",
  "ctaBody": "Start with a free, no-pitch assessment. We'll show you the one automation that pays for itself first."
}
```

- [ ] **Step 2: Add `about` messages (ES)**

```json
"about": {
  "kicker": "Est. 2024 / Harlingen, TX",
  "title": "Quiénes somos.",
  "intro": "Bespoke Intelligent Solutions lleva consultoría de IT e IA de nivel empresarial a los negocios que las grandes firmas pasan por alto. Servimos a quienes exigen Inteligencia Brutal y profundidad Estratégica.",
  "founderKicker": "El Fundador",
  "founderName": "Dan Lopez",
  "founderQuote": "Creé BIS porque la brecha entre la capacidad empresarial y la ejecución local se hacía cada vez más grande. Mi misión es cerrar esa brecha con precisión de ingeniería.",
  "founderBio": "Dan Lopez es el arquitecto detrás de Bespoke Intelligent Solutions. Con una carrera forjada en el liderazgo de IT global de alto riesgo, Dan regresó a sus raíces en Harlingen con una visión única: llevar consultoría sofisticada de IA e IT de nivel empresarial a los mercados que las grandes firmas ignoran. Su enfoque no es de talla única — es el 'Bespoke': una estrategia a la medida que respeta el ADN único de cada organización con la que colabora.",
  "credKicker": "Profundidad Técnica y Credenciales",
  "cred1Title": "Más de 20 años de liderazgo en IT",
  "cred1Body": "Dos décadas navegando cambios tecnológicos complejos al más alto nivel.",
  "cred2Title": "Operaciones Transfronterizas",
  "cred2Body": "Logística y arquitectura de múltiples oficinas para operaciones globales.",
  "cred3Title": "Experto en Microsoft 365",
  "cred3Body": "Arquitectura avanzada para ecosistemas M365 y seguridad.",
  "cred4Title": "Profundidad en Seguridad",
  "cred4Body": "Implementación de Defender, Fortinet y protección avanzada contra amenazas.",
  "cred5Title": "Constructor de IA",
  "cred5Body": "Especializado en integración de Claude y flujos de Power Automate.",
  "cred6Title": "Salesforce / Legal-Tech",
  "cred6Body": "Optimización de plataformas para cumplimiento legal y CRM de alto rendimiento.",
  "cred7Title": "Totalmente Bilingüe",
  "cred7Body": "Ejecución fluida en inglés y español para alcance global.",
  "cred8Title": "Con raíces en Harlingen",
  "cred8Body": "Experiencia de clase mundial con profundo compromiso local.",
  "methodKicker": "La Metodología",
  "m1Title": "Evaluar",
  "m1Body": "Mapeamos tu arquitectura actual para encontrar los puntos de fricción y las oportunidades ocultas para aprovechar la IA.",
  "m2Title": "Secuenciar",
  "m2Body": "La estrategia es un juego de orden. Trazamos la secuencia de despliegue para máximo ROI y mínima interrupción.",
  "m3Title": "Construir",
  "m3Body": "La ejecución es precisión. Desarrollamos integraciones y flujos de IA a la medida de tu ADN operativo.",
  "m4Title": "Entregar",
  "m4Body": "Empoderamos a tu equipo para que sea dueño de la solución: documentación, capacitación y una hoja de ruta sostenible para crecer.",
  "ctaTitle": "Construyamos tu solución inteligente.",
  "ctaBody": "Empieza con una evaluación gratuita y sin presión de venta. Te mostraremos la primera automatización que se paga sola."
}
```

- [ ] **Step 3: Implement CredentialCard + MethodStep**

Create `src/components/marketing/CredentialCard.tsx`:

```tsx
export function CredentialCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-alt p-5">
      <h3 className="font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{body}</p>
    </div>
  );
}
```

Create `src/components/marketing/MethodStep.tsx`:

```tsx
export function MethodStep({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="border-t border-hairline py-6">
      <p className="text-sm font-bold text-gold">{index}</p>
      <h3 className="mt-1 text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-ink-muted">{body}</p>
    </div>
  );
}
```

- [ ] **Step 4: Build the About page**

Create `src/app/[locale]/about/page.tsx`:

```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CredentialCard } from '@/components/marketing/CredentialCard';
import { MethodStep } from '@/components/marketing/MethodStep';
import { CTASection } from '@/components/ui/CTASection';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');
  const c = await getTranslations('common');
  const creds = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ title: t(`cred${n}Title`), body: t(`cred${n}Body`) }));
  const steps = [
    { index: '01', title: t('m1Title'), body: t('m1Body') },
    { index: '02', title: t('m2Title'), body: t('m2Body') },
    { index: '03', title: t('m3Title'), body: t('m3Body') },
    { index: '04', title: t('m4Title'), body: t('m4Body') },
  ];
  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">{t('kicker')}</p>
        <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">{t('founderKicker')}</p>
        <h2 className="mt-2 text-3xl font-extrabold text-ink">{t('founderName')}</h2>
        <blockquote className="mt-4 text-xl font-medium text-ink">“{t('founderQuote')}”</blockquote>
        <p className="mt-4 text-ink-muted">{t('founderBio')}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="mb-6 text-xs font-bold uppercase tracking-widest text-gold">{t('credKicker')}</p>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {creds.map((cr) => <CredentialCard key={cr.title} {...cr} />)}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gold">{t('methodKicker')}</p>
        {steps.map((s) => <MethodStep key={s.index} {...s} />)}
      </section>

      <CTASection title={t('ctaTitle')} body={t('ctaBody')} cta={c('cta')} />
    </main>
  );
}
```

- [ ] **Step 5: Write + run the about e2e**

Create `e2e/about.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('about shows founder and methodology in EN', async ({ page }) => {
  await page.goto('/en/about');
  await expect(page.getByRole('heading', { name: 'Dan Lopez' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Assess' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hand off' })).toBeVisible();
});
```

Run: `npm run e2e -- about`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: about page with founder, credentials, methodology (EN/ES)"
```

---

### Task 9: Contact page (form UI only)

**Files:**
- Create: `src/app/[locale]/contact/page.tsx`, `src/components/contact/ContactForm.tsx`, `src/lib/contact-schema.ts`
- Modify: `messages/en.json`, `messages/es.json` (add `contact` namespace)
- Test: `src/lib/__tests__/contact-schema.test.ts`, `e2e/contact.spec.ts`

**Interfaces:**
- Produces: `contactSchema` (zod), `ContactFormValues` type, `<ContactForm />` (client, react-hook-form + zodResolver). **Phase 1 = UI + client validation only**; on valid submit it shows a success state locally. The submit handler is a stub `onSubmit` that Phase 2 replaces with the Server Action. No network call yet.

- [ ] **Step 1: Add `contact` messages (EN)**

```json
"contact": {
  "title": "Let's find your first hour back.",
  "intro": "Our Bespoke assessment is a high-precision diagnostic that pinpoints operational leakage and immediate automation opportunities within your existing stack.",
  "b1": "Workflows walkthrough",
  "b2": "One automation identified",
  "b3": "Security snapshot",
  "b4": "90-day roadmap",
  "fullName": "Full Name",
  "businessName": "Business Name",
  "email": "Email Address",
  "phone": "Phone Number",
  "industry": "Industry",
  "industryLegal": "Legal & Professional",
  "industryHealth": "Healthcare",
  "industryMfg": "Manufacturing",
  "industryLogistics": "Logistics",
  "industryOther": "Other",
  "language": "Preferred Language",
  "message": "Message (Optional)",
  "submit": "Book my free assessment",
  "success": "Thanks — we received your request. We'll be in touch shortly.",
  "errRequired": "This field is required",
  "errEmail": "Enter a valid email",
  "directChannel": "Direct Channel",
  "localOps": "Local Operations",
  "localOpsValue": "Harlingen, Texas — serving the Rio Grande Valley. Se habla español."
}
```

- [ ] **Step 2: Add `contact` messages (ES)**

```json
"contact": {
  "title": "Encontremos tu primera hora recuperada.",
  "intro": "Nuestra evaluación Bespoke es un diagnóstico de alta precisión que identifica las fugas operativas y las oportunidades de automatización inmediatas dentro de tu stack actual.",
  "b1": "Recorrido por tus flujos de trabajo",
  "b2": "Una automatización identificada",
  "b3": "Diagnóstico de seguridad",
  "b4": "Hoja de ruta de 90 días",
  "fullName": "Nombre Completo",
  "businessName": "Nombre del Negocio",
  "email": "Correo Electrónico",
  "phone": "Teléfono",
  "industry": "Industria",
  "industryLegal": "Legal y Profesional",
  "industryHealth": "Salud",
  "industryMfg": "Manufactura",
  "industryLogistics": "Logística",
  "industryOther": "Otra",
  "language": "Idioma Preferido",
  "message": "Mensaje (Opcional)",
  "submit": "Reservar mi evaluación gratuita",
  "success": "Gracias — recibimos tu solicitud. Nos pondremos en contacto pronto.",
  "errRequired": "Este campo es obligatorio",
  "errEmail": "Ingresa un correo válido",
  "directChannel": "Canal Directo",
  "localOps": "Operaciones Locales",
  "localOpsValue": "Harlingen, Texas — al servicio del Valle del Río Grande. Se habla español."
}
```

- [ ] **Step 3: Write the failing schema test**

Create `src/lib/__tests__/contact-schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { contactSchema } from '@/lib/contact-schema';

describe('contactSchema', () => {
  it('accepts a valid submission', () => {
    const r = contactSchema.safeParse({
      fullName: 'Ana', businessName: 'Acme', email: 'ana@acme.com',
      phone: '956-555-0100', industry: 'legal', language: 'es', message: '',
    });
    expect(r.success).toBe(true);
  });
  it('rejects a bad email and missing name', () => {
    const r = contactSchema.safeParse({
      fullName: '', businessName: 'Acme', email: 'nope', phone: '956', industry: 'legal', language: 'en',
    });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- contact-schema`
Expected: FAIL — cannot resolve `@/lib/contact-schema`.

- [ ] **Step 5: Implement the schema**

Create `src/lib/contact-schema.ts`:

```ts
import { z } from 'zod';

export const contactSchema = z.object({
  fullName: z.string().min(1),
  businessName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  industry: z.enum(['legal', 'health', 'mfg', 'logistics', 'other']),
  language: z.enum(['en', 'es']),
  message: z.string().optional().default(''),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
```

- [ ] **Step 6: Run test to verify pass**

Run: `npm test -- contact-schema`
Expected: PASS (2 tests).

- [ ] **Step 7: Implement ContactForm (client, validation only)**

Create `src/components/contact/ContactForm.tsx`:

```tsx
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { contactSchema, type ContactFormValues } from '@/lib/contact-schema';

export function ContactForm() {
  const t = useTranslations('contact');
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ContactFormValues>({ resolver: zodResolver(contactSchema), defaultValues: { language: 'en', industry: 'legal', message: '' } });

  // Phase 2 replaces this stub with a Server Action call.
  const onSubmit = async (_values: ContactFormValues) => { setSent(true); };

  if (sent) return <p role="status" className="rounded-md bg-surface-alt p-6 text-ink">{t('success')}</p>;

  const field = 'w-full rounded-md border border-hairline bg-surface px-3 py-2 text-ink';
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div>
        <label className="text-sm text-ink-muted">{t('fullName')}</label>
        <input className={field} {...register('fullName')} />
        {errors.fullName && <p className="text-sm text-red-600">{t('errRequired')}</p>}
      </div>
      <div>
        <label className="text-sm text-ink-muted">{t('businessName')}</label>
        <input className={field} {...register('businessName')} />
        {errors.businessName && <p className="text-sm text-red-600">{t('errRequired')}</p>}
      </div>
      <div>
        <label className="text-sm text-ink-muted">{t('email')}</label>
        <input className={field} type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-red-600">{t('errEmail')}</p>}
      </div>
      <div>
        <label className="text-sm text-ink-muted">{t('phone')}</label>
        <input className={field} {...register('phone')} />
        {errors.phone && <p className="text-sm text-red-600">{t('errRequired')}</p>}
      </div>
      <div>
        <label className="text-sm text-ink-muted">{t('industry')}</label>
        <select className={field} {...register('industry')}>
          <option value="legal">{t('industryLegal')}</option>
          <option value="health">{t('industryHealth')}</option>
          <option value="mfg">{t('industryMfg')}</option>
          <option value="logistics">{t('industryLogistics')}</option>
          <option value="other">{t('industryOther')}</option>
        </select>
      </div>
      <div>
        <label className="text-sm text-ink-muted">{t('language')}</label>
        <select className={field} {...register('language')}>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
      </div>
      <div>
        <label className="text-sm text-ink-muted">{t('message')}</label>
        <textarea className={field} rows={4} {...register('message')} />
      </div>
      <button type="submit" disabled={isSubmitting} className="rounded-md bg-primary px-6 py-3 font-bold text-on-primary disabled:opacity-60">
        {t('submit')} &gt;
      </button>
    </form>
  );
}
```

- [ ] **Step 8: Build the Contact page**

Create `src/app/[locale]/contact/page.tsx`:

```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ContactForm } from '@/components/contact/ContactForm';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const bullets = [t('b1'), t('b2'), t('b3'), t('b4')];
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
          <p className="mt-4 text-ink-muted">{t('intro')}</p>
          <ul className="mt-6 space-y-2">
            {bullets.map((b) => <li key={b} className="flex items-center gap-2 text-ink"><span className="h-2 w-2 rounded-full bg-gold" />{b}</li>)}
          </ul>
          <div className="mt-8 text-sm text-ink-muted">
            <p className="font-bold uppercase">{t('localOps')}</p>
            <p>{t('localOpsValue')}</p>
          </div>
        </div>
        <ContactForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 9: Write + run the contact e2e**

Create `e2e/contact.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('contact form validates then shows success', async ({ page }) => {
  await page.goto('/en/contact');
  await page.getByRole('button', { name: /Book my free assessment/i }).click();
  await expect(page.getByText('This field is required').first()).toBeVisible();

  await page.getByLabel('Full Name').fill('Ana Reyes');
  await page.getByLabel('Business Name').fill('Reyes Law');
  await page.getByLabel('Email Address').fill('ana@reyeslaw.com');
  await page.getByLabel('Phone Number').fill('956-555-0100');
  await page.getByRole('button', { name: /Book my free assessment/i }).click();
  await expect(page.getByRole('status')).toBeVisible();
});
```

Run: `npm run e2e -- contact`
Expected: 1 passed.

- [ ] **Step 10: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: contact page with validated form UI (backend in Phase 2)"
```

---

### Task 10: Metadata, not-found, sitemap, deploy readiness

**Files:**
- Create: `src/app/[locale]/not-found.tsx`, `src/app/not-found.tsx`
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify: `src/app/[locale]/layout.tsx` (add `generateMetadata`)
- Modify: `messages/en.json`, `messages/es.json` (add `meta` namespace)
- Test: `e2e/meta.spec.ts`

**Interfaces:**
- Produces: per-locale `<title>`/description, a localized 404, `sitemap.xml` + `robots.txt`. No new consumers.

- [ ] **Step 1: Add `meta` messages**

`messages/en.json`:

```json
"meta": {
  "title": "Bespoke Intelligent Solutions — AI, IT & Web for the Rio Grande Valley",
  "description": "Enterprise-grade AI adoption, security, and modern web design — right-sized for Rio Grande Valley businesses. Bilingual, one point of contact.",
  "notFound": "Page not found",
  "notFoundCta": "Back home"
}
```

`messages/es.json`:

```json
"meta": {
  "title": "Bespoke Intelligent Solutions — IA, IT y Web para el Valle del Río Grande",
  "description": "Adopción de IA de nivel empresarial, seguridad y diseño web moderno — a la medida de los negocios del Valle del Río Grande. Bilingüe, un solo punto de contacto.",
  "notFound": "Página no encontrada",
  "notFoundCta": "Volver al inicio"
}
```

- [ ] **Step 2: Add `generateMetadata` to the locale layout**

In `src/app/[locale]/layout.tsx`, add above the component:

```tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('title'), description: t('description') };
}
```

- [ ] **Step 3: Localized + root not-found**

Create `src/app/[locale]/not-found.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('meta');
  return (
    <main className="mx-auto max-w-3xl px-6 py-32 text-center">
      <h1 className="text-4xl font-extrabold text-ink">404</h1>
      <p className="mt-2 text-ink-muted">{t('notFound')}</p>
      <Link href="/" className="mt-6 inline-block rounded-md bg-primary px-5 py-2 font-bold text-on-primary">{t('notFoundCta')}</Link>
    </main>
  );
}
```

Create `src/app/not-found.tsx` (root fallback for unmatched non-locale paths):

```tsx
export default function RootNotFound() {
  return (
    <html lang="en"><body style={{ fontFamily: 'system-ui', padding: '4rem', textAlign: 'center' }}>
      <h1>404 — Page not found</h1>
      <a href="/en">Back home</a>
    </body></html>
  );
}
```

- [ ] **Step 4: Sitemap + robots**

Create `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bespokeintelligent.com';
const PATHS = ['', '/services', '/industries', '/about', '/contact'];

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    PATHS.map((p) => ({ url: `${BASE}/${locale}${p}`, changeFrequency: 'monthly' as const, priority: p === '' ? 1 : 0.8 }))
  );
}
```

Create `src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bespokeintelligent.com';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${BASE}/sitemap.xml` };
}
```

- [ ] **Step 5: Write + run the meta e2e**

Create `e2e/meta.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('localized titles and 404', async ({ page }) => {
  await page.goto('/es');
  await expect(page).toHaveTitle(/Valle del Río Grande/);
  const res = await page.goto('/en/does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.getByText('Page not found')).toBeVisible();
});
```

Run: `npm run e2e -- meta`
Expected: 1 passed.

- [ ] **Step 6: Full verification pass**

Run: `npm test`  → Expected: all unit tests PASS.
Run: `npm run build` → Expected: build succeeds, all `[locale]` routes prerendered.
Run: `npm run e2e` → Expected: all specs PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: localized metadata, 404, sitemap, robots"
```

- [ ] **Step 8: Push Phase 1**

```bash
git push -u origin main
```

---

## Deferred to later phases

- **Phase 2 (Contact automation):** Server Action, Neon + Drizzle `leads` table, Resend notification + bilingual thank-you, replacing the `ContactForm` stub `onSubmit`. Env: `RESEND_API_KEY`, `DATABASE_URL`, `CONTACT_NOTIFY_TO`.
- **Phase 3 (Content system):** MDX blog (`/insights`) + case studies (`/work`), bilingual, wired into the Home "What we think" section and footer.
- **Pre-launch:** real domain + DNS, verified Resend sender, final contact email, real testimonials/case content.

## Notes for the executor

- The Stitch draft is the **visual reference**, not code to paste. Match layout/spacing/hierarchy; the CSS here is a faithful starting point to refine against the screenshots at `scratchpad/stitch_*.html`.
- Playwright `getByLabel` relies on associating `<label>` with inputs. If a label match fails, wrap inputs in the label or add `htmlFor`/`id`; adjust rather than loosen the assertion.
- Keep both `messages/*.json` in lockstep — a missing key in one locale throws in dev.
