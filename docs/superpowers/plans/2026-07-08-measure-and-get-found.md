# Measure & Get Found — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Vercel analytics + a lead conversion event, and a bilingual SEO package (per-page metadata, hreflang, `ProfessionalService` JSON-LD, dynamic OG images) to the existing BIS marketing site.

**Architecture:** Analytics is two Vercel components in the root layout plus one `track()` call on successful submit. SEO centers on a single `pageMetadata()` helper each page's `generateMetadata` calls (canonical + hreflang + OG/Twitter), a `StructuredData` server component in the layout emitting one `ProfessionalService` JSON-LD block from a central `business` facts module, and a `/og` route that renders branded per-page social cards via `ImageResponse`.

**Tech Stack:** Next.js 16.2 App Router · next-intl v4 · `@vercel/analytics@2.0.1` · `@vercel/speed-insights@2.0.0` · `next/og` (`ImageResponse`) · Vitest + Playwright.

## Global Constraints

- Next.js 16.2, next-intl v4. Work from repo root `C:\Users\danlo\BIS-Website`. Node 24, npm.
- `metadataBase` and all absolute URLs use `https://bis-rgv.com`. Locales `['en','es']`, default `en` (from `@/i18n/routing`).
- Every new user-facing string lives in `messages/en.json` + `messages/es.json` with **identical key sets** (next-intl throws on a missing key).
- Analytics is **cookieless** — do NOT add a consent banner.
- Business NAP facts (central, verbatim): name `Bespoke Intelligent Solutions`; locality `Harlingen`, region `TX`, country `US` (NO street address); email `bespokeintelligentsolutions@gmail.com`; phone **placeholder `+1-956-000-0000`** (Dan replaces before launch); areaServed `Rio Grande Valley`, `McAllen`, `Harlingen`, `Brownsville`, `Edinburg`; founder `Dan Lopez`; languages `English`, `Spanish`; `sameAs` empty until a LinkedIn URL is provided.
- Brand wordmark renders as `bis>`.
- Commit after each task with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit`.
- Repo note: `AGENTS.md` warns Next 16.2 may differ from training data — consult `node_modules/next/dist/docs/` for `generateMetadata`, `ImageResponse`, and route-handler APIs if anything behaves unexpectedly.

---

### Task 1: Vercel Analytics + Speed Insights + lead conversion event

**Files:**
- Modify: `package.json` (deps)
- Modify: `src/app/[locale]/layout.tsx` (mount `<Analytics/>` + `<SpeedInsights/>`)
- Modify: `src/components/contact/ContactForm.tsx` (fire `track` on success)
- Test: `src/components/contact/__tests__/ContactForm.test.tsx` (extend)

**Interfaces:**
- Produces: analytics mounted site-wide; a `lead_submitted` custom event fired with `{ locale, industry }` on a successful contact submit.

- [ ] **Step 1: Install deps**

```bash
cd "C:/Users/danlo/BIS-Website"
npm install @vercel/analytics@2.0.1 @vercel/speed-insights@2.0.0
```

- [ ] **Step 2: Mount Analytics + Speed Insights in the locale layout**

In `src/app/[locale]/layout.tsx`, add imports and render both just before `</body>` closes, inside the existing `<body>` (after the providers block). Add near the top imports:

```tsx
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
```

Then inside `<body>`, after the `ThemeProvider`/`NextIntlClientProvider` block (as siblings, still inside `<body>`):

```tsx
        <Analytics />
        <SpeedInsights />
```

(Do not otherwise change the existing provider/Header/Footer nesting.)

- [ ] **Step 3: Write the failing test for the conversion event**

Extend `src/components/contact/__tests__/ContactForm.test.tsx`. Add a mock for `@vercel/analytics` at the top (with the other mocks) and a locale mock, then a new test:

```tsx
import { track } from '@vercel/analytics';
vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));
vi.mock('next-intl', async (orig) => ({ ...(await orig<typeof import('next-intl')>()), useLocale: () => 'en' }));

// ...inside describe('ContactForm', ...):
it('fires a lead_submitted analytics event only on a successful submit', async () => {
  const user = userEvent.setup();
  submitContact.mockResolvedValueOnce({ ok: true });
  fill();
  await fillValid(user);
  await user.click(screen.getByRole('button', { name: /Book my free assessment/i }));
  await screen.findByText(/we received your request/i);
  expect(track).toHaveBeenCalledWith('lead_submitted', { locale: 'en', industry: 'legal' });
});

it('does NOT fire lead_submitted when the submit fails', async () => {
  const user = userEvent.setup();
  (track as unknown as ReturnType<typeof vi.fn>).mockClear();
  submitContact.mockResolvedValueOnce({ ok: false, error: 'failed' });
  fill();
  await fillValid(user);
  await user.click(screen.getByRole('button', { name: /Book my free assessment/i }));
  await screen.findByText(/Something went wrong/i);
  expect(track).not.toHaveBeenCalled();
});
```

(The existing `fill()`/`fillValid()` helpers set `industry` to its default `legal` and language `en`.)

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- ContactForm`
Expected: FAIL — `track` not called (the form doesn't emit it yet).

- [ ] **Step 5: Fire the event on success**

In `src/components/contact/ContactForm.tsx`:
- Add imports: `import { track } from '@vercel/analytics';` and `import { useLocale } from 'next-intl';`
- Inside the component, add: `const locale = useLocale();`
- In `onSubmit`, after `if (result.ok)` succeeds, fire the event:

```tsx
const onSubmit = async (values: ContactFormValues) => {
  setErrored(false);
  const result = await submitContact({ ...values, website: honeypotRef.current?.value ?? '' });
  if (result.ok) {
    track('lead_submitted', { locale, industry: values.industry });
    setSent(true);
  } else {
    setErrored(true);
  }
};
```

(Keep the honeypot merge and everything else unchanged.)

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- ContactForm`
Expected: PASS (both new tests + the existing ones).

- [ ] **Step 7: Full check + commit**

Run: `npm test` → all pass. `npm run build` → succeeds. `npm run lint` → clean.

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: vercel analytics + speed insights + lead_submitted conversion event"
```

---

### Task 2: Central business facts + per-page metadata (titles, hreflang, canonical) + sitemap alternates

**Files:**
- Create: `src/lib/seo/business.ts`, `src/lib/seo/metadata.ts`
- Modify: `src/app/[locale]/layout.tsx` (add `metadataBase` + title template)
- Modify: `src/app/[locale]/page.tsx`, `.../services/page.tsx`, `.../industries/page.tsx`, `.../about/page.tsx`, `.../contact/page.tsx` (add `generateMetadata`)
- Modify: `messages/en.json`, `messages/es.json` (per-page `meta` keys)
- Modify: `src/app/sitemap.ts` (per-URL `alternates.languages`)
- Test: `src/lib/seo/__tests__/metadata.test.ts`, `e2e/seo.spec.ts`

**Interfaces:**
- Produces: `business` facts object from `@/lib/seo/business`; `pageMetadata({ locale, path, title, description })` from `@/lib/seo/metadata` returning a Next `Metadata` with `alternates.canonical`, `alternates.languages` (`en`/`es`/`x-default`), and `openGraph`/`twitter` (WITHOUT an image yet — Task 4 adds it).

- [ ] **Step 1: Central business facts**

Create `src/lib/seo/business.ts`:

```ts
export const business = {
  name: 'Bespoke Intelligent Solutions',
  url: 'https://bis-rgv.com',
  email: 'bespokeintelligentsolutions@gmail.com',
  // PLACEHOLDER — replace with the real business number before launch.
  phone: '+1-956-000-0000',
  address: { locality: 'Harlingen', region: 'TX', country: 'US' },
  areaServed: ['Rio Grande Valley', 'McAllen', 'Harlingen', 'Brownsville', 'Edinburg'],
  founder: 'Dan Lopez',
  languages: ['English', 'Spanish'],
  sameAs: [] as string[], // add LinkedIn URL when available
} as const;

export const SITE_URL = business.url;
```

- [ ] **Step 2: Write the failing metadata-helper test**

Create `src/lib/seo/__tests__/metadata.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { pageMetadata } from '../metadata';

describe('pageMetadata', () => {
  it('builds canonical + hreflang alternates for a sub-path', () => {
    const m = pageMetadata({ locale: 'es', path: '/services', title: 'Qué hacemos', description: 'desc' });
    expect(m.title).toBe('Qué hacemos');
    expect(m.alternates?.canonical).toBe('https://bis-rgv.com/es/services');
    expect(m.alternates?.languages).toMatchObject({
      en: 'https://bis-rgv.com/en/services',
      es: 'https://bis-rgv.com/es/services',
      'x-default': 'https://bis-rgv.com/en/services',
    });
  });
  it('handles the home path without a trailing segment', () => {
    const m = pageMetadata({ locale: 'en', path: '/', title: 'Home', description: 'd' });
    expect(m.alternates?.canonical).toBe('https://bis-rgv.com/en');
    expect(m.alternates?.languages).toMatchObject({ 'x-default': 'https://bis-rgv.com/en' });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- seo/__tests__/metadata`
Expected: FAIL — cannot resolve `../metadata`.

- [ ] **Step 4: Implement the metadata helper**

Create `src/lib/seo/metadata.ts`:

```ts
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { SITE_URL, business } from './business';

export function pageMetadata({
  locale, path, title, description,
}: { locale: string; path: string; title: string; description: string }): Metadata {
  const seg = path === '/' ? '' : path;
  const canonical = `${SITE_URL}/${locale}${seg}`;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}${seg}`;
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${seg}`;
  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title, description, url: canonical, siteName: business.name,
      locale, type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- seo/__tests__/metadata`
Expected: PASS.

- [ ] **Step 6: Add `metadataBase` + title template to the layout**

In `src/app/[locale]/layout.tsx` `generateMetadata`, change the returned object to add `metadataBase` and a title template while keeping the existing localized default title/description:

```tsx
return {
  metadataBase: new URL('https://bis-rgv.com'),
  title: { default: t('title'), template: '%s · Bespoke Intelligent Solutions' },
  description: t('description'),
};
```

(Keep the `getTranslations({ locale, namespace: 'meta' })` call as-is.)

- [ ] **Step 7: Add per-page `meta` message keys (EN)**

In `messages/en.json` `meta`, ADD:

```json
"homeTitle": "AI, IT & Web for Rio Grande Valley Businesses",
"homeDescription": "Enterprise-grade AI, security, and modern web — right-sized for Rio Grande Valley businesses. Bilingual, one point of contact.",
"servicesTitle": "Services — AI, IT Security & Web Design",
"servicesDescription": "AI & automation, enterprise IT and security, and modern bilingual web design for RGV businesses.",
"industriesTitle": "Industries — Built for the Valley",
"industriesDescription": "AI and IT solutions tailored for Rio Grande Valley legal, medical, logistics, skilled-trades, and agriculture businesses.",
"aboutTitle": "About — Who We Are",
"aboutDescription": "Bespoke Intelligent Solutions brings enterprise-grade AI and IT consultancy to the Rio Grande Valley, founded by Dan Lopez.",
"contactTitle": "Free Assessment — Contact Us",
"contactDescription": "Book a free, no-pitch assessment. We find the one automation that pays for itself first. Bilingual, RGV-based."
```

- [ ] **Step 8: Add per-page `meta` message keys (ES)**

In `messages/es.json` `meta`, ADD:

```json
"homeTitle": "IA, IT y Web para Negocios del Valle del Río Grande",
"homeDescription": "IA de nivel empresarial, seguridad y web moderna — a la medida de los negocios del Valle del Río Grande. Bilingüe, un solo punto de contacto.",
"servicesTitle": "Servicios — IA, Seguridad IT y Diseño Web",
"servicesDescription": "IA y automatización, IT y seguridad empresarial, y diseño web bilingüe moderno para negocios del RGV.",
"industriesTitle": "Industrias — Hecho para el Valle",
"industriesDescription": "Soluciones de IA e IT a la medida para negocios legales, médicos, de logística, oficios y agricultura del Valle del Río Grande.",
"aboutTitle": "Nosotros — Quiénes Somos",
"aboutDescription": "Bespoke Intelligent Solutions lleva consultoría de IA e IT de nivel empresarial al Valle del Río Grande, fundada por Dan Lopez.",
"contactTitle": "Evaluación Gratuita — Contáctanos",
"contactDescription": "Reserva una evaluación gratuita y sin presión de venta. Encontramos la primera automatización que se paga sola. Bilingüe, en el RGV."
```

- [ ] **Step 9: Add `generateMetadata` to each of the 5 pages**

For each page, add a `generateMetadata` export. Home (`src/app/[locale]/page.tsx`):

```tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/', title: t('homeTitle'), description: t('homeDescription') });
}
```

Repeat for the other four, changing only `path` and the message keys:
- `src/app/[locale]/services/page.tsx` → `path: '/services'`, `t('servicesTitle')`, `t('servicesDescription')`
- `src/app/[locale]/industries/page.tsx` → `path: '/industries'`, `t('industriesTitle')`, `t('industriesDescription')`
- `src/app/[locale]/about/page.tsx` → `path: '/about'`, `t('aboutTitle')`, `t('aboutDescription')`
- `src/app/[locale]/contact/page.tsx` → `path: '/contact'`, `t('contactTitle')`, `t('contactDescription')`

(Each page keeps its existing default export + `setRequestLocale` call unchanged; just add the `generateMetadata` export and its imports.)

- [ ] **Step 10: Add hreflang alternates to the sitemap**

Replace `src/app/sitemap.ts` with:

```ts
import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bis-rgv.com';
const PATHS = ['', '/services', '/industries', '/about', '/contact'];

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    PATHS.map((p) => ({
      url: `${BASE}/${locale}${p}`,
      changeFrequency: 'monthly' as const,
      priority: p === '' ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${BASE}/${l}${p}`])),
      },
    }))
  );
}
```

- [ ] **Step 11: Write + run the SEO e2e**

Create `e2e/seo.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('pages have unique titles and hreflang + canonical', async ({ page }) => {
  await page.goto('/en/services');
  await expect(page).toHaveTitle(/Services/);
  const servicesTitle = await page.title();

  await page.goto('/en/about');
  const aboutTitle = await page.title();
  expect(aboutTitle).not.toBe(servicesTitle);
  await expect(page).toHaveTitle(/About/);

  // hreflang + canonical on a page
  await page.goto('/es/services');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://bis-rgv.com/es/services');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://bis-rgv.com/en/services');
  await expect(page.locator('link[hreflang="es"]')).toHaveAttribute('href', 'https://bis-rgv.com/es/services');
  await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute('href', 'https://bis-rgv.com/en/services');
});
```

Run: `npm run e2e -- seo`
Expected: 1 passed.

- [ ] **Step 12: Verify key parity, build, commit**

Run: `node -e "const a=require('./messages/en.json'),b=require('./messages/es.json');const k=o=>Object.entries(o).flatMap(([n,v])=>Object.keys(v).map(x=>n+'.'+x)).sort();console.log('equal',JSON.stringify(k(a))===JSON.stringify(k(b)));"` → `equal true`.
Run: `npm test` → all pass. `npm run build` → succeeds. `npm run lint` → clean.

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: per-page metadata, hreflang/canonical, sitemap alternates"
```

---

### Task 3: ProfessionalService JSON-LD structured data

**Files:**
- Create: `src/components/seo/StructuredData.tsx`
- Modify: `src/app/[locale]/layout.tsx` (mount it)
- Test: `src/components/seo/__tests__/StructuredData.test.tsx`

**Interfaces:**
- Consumes: `business` from `@/lib/seo/business`.
- Produces: `<StructuredData />` — a server component rendering one `application/ld+json` script with a `ProfessionalService` graph.

- [ ] **Step 1: Write the failing test**

Create `src/components/seo/__tests__/StructuredData.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StructuredData } from '../StructuredData';

describe('StructuredData', () => {
  it('emits a valid ProfessionalService JSON-LD block', () => {
    const { container } = render(<StructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('ProfessionalService');
    expect(data.name).toBe('Bespoke Intelligent Solutions');
    expect(data.address.addressLocality).toBe('Harlingen');
    expect(data.areaServed).toContain('Rio Grande Valley');
    expect(data.availableLanguage).toEqual(['English', 'Spanish']);
    expect(data.founder.name).toBe('Dan Lopez');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- StructuredData`
Expected: FAIL — cannot resolve `../StructuredData`.

- [ ] **Step 3: Implement the component**

Create `src/components/seo/StructuredData.tsx`:

```tsx
import { business } from '@/lib/seo/business';

export function StructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: business.name,
    url: business.url,
    email: business.email,
    telephone: business.phone,
    description:
      'Enterprise-grade AI adoption, IT security, and modern bilingual web design for Rio Grande Valley businesses.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.address.locality,
      addressRegion: business.address.region,
      addressCountry: business.address.country,
    },
    areaServed: business.areaServed,
    availableLanguage: business.languages,
    founder: { '@type': 'Person', name: business.founder },
    ...(business.sameAs.length > 0 ? { sameAs: business.sameAs } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- StructuredData`
Expected: PASS.

- [ ] **Step 5: Mount it in the layout**

In `src/app/[locale]/layout.tsx`, import and render `<StructuredData />` inside `<body>` (e.g., right after `<Analytics /><SpeedInsights />`):

```tsx
import { StructuredData } from '@/components/seo/StructuredData';
// ...inside <body>:
        <StructuredData />
```

- [ ] **Step 6: Build + commit**

Run: `npm test` → all pass. `npm run build` → succeeds. `npm run lint` → clean.

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: ProfessionalService JSON-LD structured data"
```

---

### Task 4: Dynamic branded OG image + wire into metadata

**Files:**
- Create: `src/app/og/route.tsx`
- Modify: `src/lib/seo/metadata.ts` (add the OG image URL to `openGraph`/`twitter`)
- Test: `e2e/og.spec.ts`

**Interfaces:**
- Consumes: `pageMetadata` from Task 2.
- Produces: a `GET /og?title=...` route returning a 1200×630 branded PNG; every page's `openGraph.images` + `twitter.images` point at it with the page title.

- [ ] **Step 1: Create the OG image route**

Create `src/app/og/route.tsx`:

```tsx
import { ImageResponse } from 'next/og';

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') ?? 'Bespoke Intelligent Solutions').slice(0, 120);
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', background: '#f9f9f9', padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 800, color: '#1b1b1b' }}>bis&gt;</div>
        <div style={{ fontSize: 64, fontWeight: 800, color: '#1b1b1b', lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 30, color: '#2745e0', fontWeight: 700 }}>
          Bespoke Intelligent Solutions · Rio Grande Valley
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
```

- [ ] **Step 2: Add the OG image URL to `pageMetadata`**

In `src/lib/seo/metadata.ts`, compute the image URL and add it to `openGraph.images` and `twitter.images`. Update the function body:

```ts
  const ogImage = `${SITE_URL}/og?title=${encodeURIComponent(title)}`;
  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title, description, url: canonical, siteName: business.name,
      locale, type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
```

- [ ] **Step 3: Write + run the OG e2e**

Create `e2e/og.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('OG route returns a PNG image', async ({ request }) => {
  const res = await request.get('/og?title=Test%20Card');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
});

test('a page references the OG image in its metadata', async ({ page }) => {
  await page.goto('/en/services');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\?title=/);
});
```

Run: `npm run e2e -- og`
Expected: 2 passed.

- [ ] **Step 4: Full verification + commit**

Run: `npm test` → all pass.
Run: `npm run build` → succeeds (the `/og` route builds; `metadata` images resolve against `metadataBase`).
Run: `npm run lint` → clean.
Run: `npm run e2e` → all specs pass. (Known infra flake: `nav.spec.ts` under ≥6 parallel workers; if it's the sole failure and passes on an isolated re-run, treat the suite as green — do not modify it.)

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: dynamic branded OG image route wired into page metadata"
```

---

## Self-review notes (addressed)

- **Spec coverage:** Analytics + `lead_submitted` (Task 1); `metadataBase` + per-page titles + hreflang/canonical + sitemap alternates (Task 2); `ProfessionalService` JSON-LD from central facts (Task 3); dynamic OG + Twitter cards (Task 4). Google Business Profile is explicitly off-site (owner action), not a task.
- **Type consistency:** `business`, `SITE_URL`, `pageMetadata({ locale, path, title, description })` are defined in Task 2 and consumed unchanged in Tasks 3–4; `track('lead_submitted', { locale, industry })` matches its test.
- **No live network in unit tests:** analytics `track` and the metadata helper are pure/mocked; the OG route and hreflang are verified via Playwright against the dev server.
- **Placeholder note:** `business.phone` is a real config constant with a documented placeholder value for Dan to replace — not a plan gap.

## Post-implementation (owner actions, not code)
- Replace `business.phone` with the real number; add a LinkedIn URL to `business.sameAs` if desired.
- Create the **Google Business Profile** (service-area: Harlingen + RGV) with matching Name/Phone.
- After deploy: confirm events in the Vercel Analytics dashboard; validate the JSON-LD in Google's Rich Results Test; check a shared link's OG card.
