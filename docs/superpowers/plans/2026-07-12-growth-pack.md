# Growth Pack (FAQ · Service-Area · Resource Lead Magnet) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three lead-gen / local-SEO features — an FAQ page, a service-area hub, and an email-gated resource library (AI Readiness Checklist) — to the BIS site.

**Architecture:** Three independent features built on existing patterns. FAQ + service-area are server-component content pages with i18n-by-id data + JSON-LD. The resource lead magnet reuses the contact "pure orchestrator + injected deps + Resend + Neon" seam with a new `subscribers` table and a statically-generated PDF served from `/public`.

**Tech Stack:** Next 16 App Router · next-intl v4 (EN/ES) · Tailwind v4 tokens · Drizzle + Neon Postgres · Resend + @react-email · react-hook-form + zod · pdfkit (build-time) · Vitest + Playwright.

## Global Constraints

- Work from repo root `C:\Users\danlo\BIS-Website`. Node 24, npm. Branch: create `feat/growth-pack` off `main` (do not work on `main`).
- Ship/build order: **FAQ (Tasks 1–2) → Service-Area (Tasks 3–4) → Resource lead magnet (Tasks 5–10)**. Each feature is independently green + committable + deployable.
- All new copy is EN + ES with parity; ES follows site convention (keep "IT", not "TI"; RGV-idiomatic Spanish). Language-neutral proper nouns (city names) live in `business.ts`, not i18n.
- Reuse: `pageMetadata({ locale, path, title, description })` for metadata; `Link` from `@/i18n/navigation`; page pattern = server component with `setRequestLocale(locale)` + `getTranslations`.
- Native Vitest matchers only (no jest-dom). zod v4 (`z.email()`, not `z.string().email()`).
- Commit with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit`.
- Every task ends green: `npm run lint` clean, `npm run build` succeeds, relevant tests pass.
- i18n parity spot-check command (run where a task says to):
  ```bash
  node -e "const a=require('./messages/en.json'),b=require('./messages/es.json');const k=o=>Object.entries(o).flatMap(([n,v])=>typeof v==='object'&&v?Object.keys(v).flatMap(x=>typeof v[x]==='object'&&v[x]?Object.keys(v[x]).map(y=>n+'.'+x+'.'+y):[n+'.'+x]):[n]).sort();console.log('equal',JSON.stringify(k(a))===JSON.stringify(k(b)));"
  ```
  (This spot-check only descends 3 levels; the per-feature coverage tests below are the authoritative parity gate.)

---

## FEATURE A — FAQ

### Task 1: FAQ data + i18n + coverage test

**Files:**
- Create: `src/lib/faq.ts`
- Modify: `messages/en.json`, `messages/es.json` (add `faq` namespace)
- Test: `src/lib/__tests__/faq.test.ts`

**Interfaces:**
- Produces: `faqCategories: readonly { id: string; items: readonly string[] }[]` and `faqItemIds: string[]` (flat list of every question id).

- [ ] **Step 1: Add the `faq` data module**

Create `src/lib/faq.ts`:
```ts
// Category → ordered question ids. Text lives in the `faq` i18n namespace
// (faq.items.<id>.q / .a); headings in faq.categories.<id>.
export const faqCategories = [
  { id: 'general', items: ['whatIsBis', 'whoServe', 'bespoke'] },
  { id: 'ai', items: ['aiPractical', 'aiCost'] },
  { id: 'security', items: ['dataHandling', 'compliance'] },
  { id: 'web', items: ['ownWebsite', 'webWhat'] },
  { id: 'working', items: ['howStart', 'pricing', 'remote'] },
] as const;

export const faqItemIds: string[] = faqCategories.flatMap((c) => [...c.items]);
```

- [ ] **Step 2: Add the EN `faq` namespace**

In `messages/en.json`, add a top-level `"faq"` key (after `"insights"` is fine):
```json
"faq": {
  "title": "Frequently Asked Questions",
  "metaDescription": "Answers about how Bespoke Intelligent Solutions helps Rio Grande Valley businesses with AI, IT security, and bilingual web design.",
  "intro": "Straight answers about how we work, what we build, and how to get started.",
  "categories": {
    "general": "General",
    "ai": "AI & Automation",
    "security": "Security & IT",
    "web": "Web & Digital",
    "working": "Working with BIS"
  },
  "items": {
    "whatIsBis": { "q": "What does Bespoke Intelligent Solutions do?", "a": "We're an IT and AI consultancy for Rio Grande Valley businesses. We help you adopt practical AI, modernize and secure your IT, and build fast bilingual websites — with one point of contact from strategy through delivery." },
    "whoServe": { "q": "Who do you work with?", "a": "Small and mid-sized Valley businesses — including legal, medical and dental, logistics and freight, skilled trades, and agriculture. Everything we do is fully bilingual in English and Spanish." },
    "bespoke": { "q": "What does “bespoke” mean for my business?", "a": "It means we start with your workflow, your customers, and your two languages — not a template. We recommend only what earns its keep, and we build it to fit how you actually operate." },
    "aiPractical": { "q": "Is AI actually practical for a business my size?", "a": "Yes. We focus on removing real hours from your week — automating intake, scheduling, follow-ups, and document handling — not flashy demos. If a task is repeatable, there's usually a piece of it we can automate." },
    "aiCost": { "q": "How much does AI cost, and what's the return?", "a": "It varies by scope, but we target automations that pay for themselves in saved time. The free assessment identifies the single automation with the fastest payback so you can start small and prove the value." },
    "dataHandling": { "q": "How do you handle our data and confidentiality?", "a": "We treat your data as confidential, work under an NDA when you want one, use least-privilege access, and prefer tools that keep your data in your own accounts. You own your systems and your data — always." },
    "compliance": { "q": "Do you work with regulated fields like legal and healthcare?", "a": "Yes. We're security-first and privacy-aware for fields like legal and medical/dental, and we design workflows with confidentiality and data protection in mind. We're not a substitute for your compliance counsel, but we build to support it." },
    "ownWebsite": { "q": "Do we own our website and accounts?", "a": "Completely. Every build ships with the keys: your hosting, your domain, your accounts. No proprietary lock-in, no black boxes — clean code you can hand to anyone." },
    "webWhat": { "q": "What kind of web work do you do?", "a": "Fast, modern, bilingual sites and web apps that convert — with native English/Spanish content, local SEO for the RGV, and analytics so you can see what's working." },
    "howStart": { "q": "How do we get started?", "a": "Book a free, no-pitch assessment. We look at how your business runs today and show you the one improvement that pays for itself first. No obligation." },
    "pricing": { "q": "How do you price your work?", "a": "Most engagements are scoped to a fixed proposal after the free assessment, so you know the cost before we start. We right-size to your business rather than selling a one-size package." },
    "remote": { "q": "Do you work remotely or on-site?", "a": "Both. We're based in Harlingen and serve the entire Valley, so we can work on-site when it helps and remotely when that's faster — whatever gets you results." }
  }
}
```

- [ ] **Step 3: Add the ES `faq` namespace**

In `messages/es.json`, add the matching `"faq"` key:
```json
"faq": {
  "title": "Preguntas Frecuentes",
  "metaDescription": "Respuestas sobre cómo Bespoke Intelligent Solutions ayuda a los negocios del Valle del Río Grande con IA, seguridad de IT y diseño web bilingüe.",
  "intro": "Respuestas claras sobre cómo trabajamos, qué construimos y cómo empezar.",
  "categories": {
    "general": "General",
    "ai": "IA y Automatización",
    "security": "Seguridad e IT",
    "web": "Web y Digital",
    "working": "Trabajar con BIS"
  },
  "items": {
    "whatIsBis": { "q": "¿Qué hace Bespoke Intelligent Solutions?", "a": "Somos una consultoría de IT e IA para los negocios del Valle del Río Grande. Te ayudamos a adoptar IA práctica, modernizar y asegurar tu IT, y crear sitios web bilingües y rápidos — con un solo punto de contacto, de la estrategia a la entrega." },
    "whoServe": { "q": "¿Con quién trabajan?", "a": "Con negocios pequeños y medianos del Valle — incluyendo legal, médico y dental, logística y transporte, oficios especializados y agricultura. Todo lo que hacemos es totalmente bilingüe en inglés y español." },
    "bespoke": { "q": "¿Qué significa “bespoke” (a la medida) para mi negocio?", "a": "Significa que empezamos con tu flujo de trabajo, tus clientes y tus dos idiomas — no con una plantilla. Solo recomendamos lo que vale la pena y lo construimos para que encaje con tu forma real de operar." },
    "aiPractical": { "q": "¿La IA es realmente práctica para un negocio de mi tamaño?", "a": "Sí. Nos enfocamos en quitarte horas reales de la semana — automatizando admisión, agendas, seguimientos y manejo de documentos — no en demos llamativas. Si una tarea es repetitiva, casi siempre hay una parte que podemos automatizar." },
    "aiCost": { "q": "¿Cuánto cuesta la IA y cuál es el retorno?", "a": "Depende del alcance, pero buscamos automatizaciones que se paguen solas con el tiempo ahorrado. La evaluación gratuita identifica la automatización con el retorno más rápido para que empieces en pequeño y compruebes el valor." },
    "dataHandling": { "q": "¿Cómo manejan nuestros datos y la confidencialidad?", "a": "Tratamos tus datos como confidenciales, trabajamos bajo un acuerdo de confidencialidad (NDA) cuando lo deseas, usamos acceso de privilegio mínimo y preferimos herramientas que mantienen tus datos en tus propias cuentas. Tú eres dueño de tus sistemas y tus datos — siempre." },
    "compliance": { "q": "¿Trabajan con áreas reguladas como legal y salud?", "a": "Sí. Somos seguridad primero y conscientes de la privacidad para áreas como legal y médico/dental, y diseñamos los flujos pensando en la confidencialidad y la protección de datos. No sustituimos a tu asesor de cumplimiento, pero construimos para apoyarlo." },
    "ownWebsite": { "q": "¿Somos dueños de nuestro sitio web y cuentas?", "a": "Por completo. Cada proyecto se entrega con las llaves: tu hosting, tu dominio, tus cuentas. Sin ataduras propietarias, sin cajas negras — código limpio que puedes entregar a cualquiera." },
    "webWhat": { "q": "¿Qué tipo de trabajo web hacen?", "a": "Sitios y aplicaciones web rápidos, modernos y bilingües que convierten — con contenido nativo en inglés/español, SEO local para el RGV y analítica para que veas qué funciona." },
    "howStart": { "q": "¿Cómo empezamos?", "a": "Reserva una evaluación gratuita y sin presión de venta. Analizamos cómo funciona tu negocio hoy y te mostramos la primera mejora que se paga sola. Sin compromiso." },
    "pricing": { "q": "¿Cómo cobran su trabajo?", "a": "La mayoría de los proyectos se definen en una propuesta de precio fijo después de la evaluación gratuita, para que conozcas el costo antes de empezar. Ajustamos a la medida de tu negocio en lugar de vender un paquete único." },
    "remote": { "q": "¿Trabajan de forma remota o presencial?", "a": "Ambas. Estamos en Harlingen y servimos a todo el Valle, así que trabajamos presencialmente cuando ayuda y de forma remota cuando es más rápido — lo que te dé resultados." }
  }
}
```

- [ ] **Step 4: Write the coverage test**

Create `src/lib/__tests__/faq.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { faqCategories, faqItemIds } from '../faq';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const en = read('en.json');
const es = read('es.json');

describe('faq data', () => {
  it('has an EN and ES heading for every category id', () => {
    for (const c of faqCategories) {
      expect(en.faq.categories[c.id], `en cat ${c.id}`).toBeTruthy();
      expect(es.faq.categories[c.id], `es cat ${c.id}`).toBeTruthy();
    }
  });
  it('has an EN and ES q + a for every item id', () => {
    for (const id of faqItemIds) {
      expect(en.faq.items[id]?.q, `en q ${id}`).toBeTruthy();
      expect(en.faq.items[id]?.a, `en a ${id}`).toBeTruthy();
      expect(es.faq.items[id]?.q, `es q ${id}`).toBeTruthy();
      expect(es.faq.items[id]?.a, `es a ${id}`).toBeTruthy();
    }
  });
});
```

- [ ] **Step 5: Run test + parity, then commit**

Run: `npx vitest run src/lib/__tests__/faq.test.ts` → PASS. Run the parity spot-check command → `equal true`.
```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: FAQ data + bilingual content"
```

---

### Task 2: FAQ page + FAQPage JSON-LD + footer link + e2e

**Files:**
- Create: `src/app/[locale]/faq/page.tsx`
- Modify: `messages/en.json`, `messages/es.json` (`footer.faq`), `src/components/layout/Footer.tsx`
- Test: `e2e/faq.spec.ts`

**Interfaces:**
- Consumes: `faqCategories` (Task 1), `pageMetadata`.

- [ ] **Step 1: Create the FAQ page**

Create `src/app/[locale]/faq/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { faqCategories } from '@/lib/faq';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faq' });
  return pageMetadata({ locale, path: '/faq', title: t('title'), description: t('metaDescription') });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'faq' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqCategories.flatMap((c) =>
      c.items.map((id) => ({
        '@type': 'Question',
        name: t(`items.${id}.q`),
        acceptedAnswer: { '@type': 'Answer', text: t(`items.${id}.a`) },
      })),
    ),
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-3 text-lg text-ink-muted">{t('intro')}</p>

      {faqCategories.map((c) => (
        <section key={c.id} className="mt-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{t(`categories.${c.id}`)}</h2>
          <div className="mt-4 divide-y divide-hairline border-y border-hairline">
            {c.items.map((id) => (
              <details key={id} className="group py-4">
                <summary className="cursor-pointer list-none text-lg font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                  {t(`items.${id}.q`)}
                </summary>
                <p className="mt-3 text-ink-muted">{t(`items.${id}.a`)}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 2: Add the footer link**

In `messages/en.json` `footer`, add `"faq": "FAQ"`. In `messages/es.json` `footer`, add `"faq": "Preguntas Frecuentes"`.

In `src/components/layout/Footer.tsx`, add an FAQ link inside the Company `<ul>` (after the `methodology` line):
```tsx
            <li><Link href="/faq">{t('faq')}</Link></li>
```

- [ ] **Step 3: Write the e2e**

Create `e2e/faq.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('FAQ page renders heading + a known question (EN)', async ({ page }) => {
  await page.goto('/en/faq');
  await expect(page.getByRole('heading', { level: 1, name: /Frequently Asked Questions/i })).toBeVisible();
  await expect(page.getByText(/What does Bespoke Intelligent Solutions do\?/i)).toBeVisible();
});

test('FAQ page renders localized heading (ES)', async ({ page }) => {
  await page.goto('/es/faq');
  await expect(page.getByRole('heading', { level: 1, name: /Preguntas Frecuentes/i })).toBeVisible();
});
```

- [ ] **Step 4: Verify + commit**

Run: `npm run build` → succeeds (`/[locale]/faq` prerenders). `npm run lint` → clean. `npm run e2e -- faq` → 2 passed. (If port 3000 is held by a non-BIS project, free it per the repo's usual note.)
```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: FAQ page + FAQPage JSON-LD + footer link + e2e"
```

---

## FEATURE B — SERVICE AREA

### Task 3: Expand city list + serviceArea i18n + coverage test

**Files:**
- Modify: `src/lib/seo/business.ts` (`areaServed`)
- Modify: `messages/en.json`, `messages/es.json` (`serviceArea` namespace)
- Test: `src/lib/seo/__tests__/service-area.test.ts`

**Interfaces:**
- Produces: expanded `business.areaServed` (first entry stays `'Rio Grande Valley'`; remaining entries are the cities rendered as chips).

- [ ] **Step 1: Expand `areaServed`**

In `src/lib/seo/business.ts`, replace the `areaServed` line with:
```ts
  areaServed: [
    'Rio Grande Valley', 'Harlingen', 'McAllen', 'Brownsville', 'Edinburg', 'Weslaco',
    'Mission', 'Pharr', 'San Benito', 'La Feria', 'Los Fresnos', 'San Juan', 'Alamo', 'Raymondville',
  ],
```

- [ ] **Step 2: Add EN `serviceArea` namespace**

In `messages/en.json`, add:
```json
"serviceArea": {
  "title": "Service Area — The Rio Grande Valley",
  "metaDescription": "Bespoke Intelligent Solutions serves businesses across the Rio Grande Valley — Harlingen, McAllen, Brownsville, Edinburg, and beyond — with AI, IT security, and bilingual web design.",
  "heading": "Serving the whole Rio Grande Valley",
  "intro": "We're based in Harlingen and work with businesses across the Valley — on-site when it helps, remote when that's faster.",
  "citiesHeading": "Cities we serve",
  "whyLocalHeading": "Why local matters",
  "whyLocalBody": "Enterprise-grade technology has always been built for somewhere else. We build for here — for the Valley's two languages, its cross-border rhythm, and the businesses that keep it running. Being local means we understand your customers, and we're a short drive away when you need us.",
  "ctaTitle": "Let's find your first hour back.",
  "ctaBody": "Book a free, no-pitch assessment — wherever you are in the Valley."
}
```

- [ ] **Step 3: Add ES `serviceArea` namespace**

In `messages/es.json`, add:
```json
"serviceArea": {
  "title": "Área de Servicio — El Valle del Río Grande",
  "metaDescription": "Bespoke Intelligent Solutions sirve a negocios en todo el Valle del Río Grande — Harlingen, McAllen, Brownsville, Edinburg y más — con IA, seguridad de IT y diseño web bilingüe.",
  "heading": "Servimos a todo el Valle del Río Grande",
  "intro": "Estamos en Harlingen y trabajamos con negocios en todo el Valle — presencialmente cuando ayuda, de forma remota cuando es más rápido.",
  "citiesHeading": "Ciudades que servimos",
  "whyLocalHeading": "Por qué lo local importa",
  "whyLocalBody": "La tecnología de nivel empresarial siempre se construyó para otro lugar. Nosotros construimos para aquí — para los dos idiomas del Valle, su ritmo fronterizo y los negocios que lo mantienen en marcha. Ser locales significa que entendemos a tus clientes y estamos a poca distancia cuando nos necesitas.",
  "ctaTitle": "Encontremos tu primera hora recuperada.",
  "ctaBody": "Reserva una evaluación gratuita y sin presión de venta — donde sea que estés en el Valle."
}
```

- [ ] **Step 4: Coverage test**

Create `src/lib/seo/__tests__/service-area.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { business } from '../business';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const en = read('en.json');
const es = read('es.json');
const KEYS = ['title', 'metaDescription', 'heading', 'intro', 'citiesHeading', 'whyLocalHeading', 'whyLocalBody', 'ctaTitle', 'ctaBody'];

describe('service area', () => {
  it('has matching EN/ES keys for the serviceArea namespace', () => {
    for (const k of KEYS) {
      expect(en.serviceArea[k], `en ${k}`).toBeTruthy();
      expect(es.serviceArea[k], `es ${k}`).toBeTruthy();
    }
  });
  it('serves the Rio Grande Valley plus specific cities', () => {
    expect(business.areaServed[0]).toBe('Rio Grande Valley');
    expect(business.areaServed).toContain('McAllen');
    expect(business.areaServed.length).toBeGreaterThan(6);
  });
});
```

- [ ] **Step 5: Run test + parity, commit**

Run: `npx vitest run src/lib/seo/__tests__/service-area.test.ts` → PASS. Parity spot-check → `equal true`.
```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: expand areaServed + service-area bilingual content"
```

---

### Task 4: Service-area page + areaServed JSON-LD + footer link + e2e

**Files:**
- Create: `src/app/[locale]/service-area/page.tsx`
- Modify: `messages/en.json`, `messages/es.json` (`footer.serviceArea`), `src/components/layout/Footer.tsx`
- Test: `e2e/service-area.spec.ts`

**Interfaces:**
- Consumes: `business` (Task 3), `pageMetadata`.

- [ ] **Step 1: Create the page**

Create `src/app/[locale]/service-area/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { business } from '@/lib/seo/business';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'serviceArea' });
  return pageMetadata({ locale, path: '/service-area', title: t('title'), description: t('metaDescription') });
}

export default async function ServiceAreaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'serviceArea' });
  const c = await getTranslations('common');
  const cities = business.areaServed.filter((a) => a !== 'Rio Grande Valley');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'IT & AI consulting',
    provider: { '@type': 'ProfessionalService', name: business.name, url: business.url },
    areaServed: business.areaServed.map((name) => ({ '@type': 'City', name })),
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-xs font-bold uppercase tracking-widest text-accent">{t('title')}</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">{t('heading')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>

      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{t('citiesHeading')}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {cities.map((city) => (
            <span key={city} className="rounded-full border border-hairline bg-surface-alt px-4 py-1.5 text-sm font-medium text-ink">{city}</span>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-hairline bg-surface-alt p-8">
        <h2 className="text-2xl font-bold text-ink">{t('whyLocalHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t('whyLocalBody')}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-ink">{t('ctaTitle')}</h2>
        <p className="mt-2 text-ink-muted">{t('ctaBody')}</p>
        <a href={`/${locale}/contact`} className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-on-primary">{c('cta')}</a>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Footer link**

In `messages/en.json` `footer` add `"serviceArea": "Service Area"`; in `messages/es.json` `footer` add `"serviceArea": "Área de Servicio"`.
In `src/components/layout/Footer.tsx`, add inside the Company `<ul>` (after the FAQ line):
```tsx
            <li><Link href="/service-area">{t('serviceArea')}</Link></li>
```

- [ ] **Step 3: e2e**

Create `e2e/service-area.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('service-area page renders heading + a city (EN)', async ({ page }) => {
  await page.goto('/en/service-area');
  await expect(page.getByRole('heading', { level: 1, name: /Serving the whole Rio Grande Valley/i })).toBeVisible();
  await expect(page.getByText('McAllen')).toBeVisible();
});

test('service-area page renders localized heading (ES)', async ({ page }) => {
  await page.goto('/es/service-area');
  await expect(page.getByRole('heading', { level: 1, name: /Servimos a todo el Valle del Río Grande/i })).toBeVisible();
});
```

- [ ] **Step 4: Verify + commit**

Run: `npm run build` → succeeds. `npm run lint` → clean. `npm run e2e -- service-area` → 2 passed.
```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: service-area hub page + areaServed JSON-LD + footer link + e2e"
```

---

## FEATURE C — RESOURCE LEAD MAGNET

### Task 5: `subscribers` table + subscriber schema

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/lib/subscriber-schema.ts`
- Create: `docs/migrations/2026-07-12-subscribers.sql`
- Test: `src/lib/__tests__/subscriber-schema.test.ts`

**Interfaces:**
- Produces: `subscribers` Drizzle table; `subscriberSchema`, `SubscriberValues` (post-parse), `SubscriberInput` (pre-parse) with fields `{ name?: string; email: string; resource: string; locale: 'en'|'es'; newsletterConsent?: boolean }`.

- [ ] **Step 1: Add the table**

In `src/db/schema.ts`, add `boolean` to the import and append the table:
```ts
import { pgTable, uuid, timestamp, text, boolean } from 'drizzle-orm/pg-core';
```
```ts
export const subscribers = pgTable('subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  email: text('email').notNull(),
  name: text('name'),
  resource: text('resource').notNull(),
  locale: text('locale').notNull(),
  newsletterConsent: boolean('newsletter_consent').notNull().default(false),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
```

- [ ] **Step 2: Record the migration SQL (run manually in Neon before go-live)**

Create `docs/migrations/2026-07-12-subscribers.sql`:
```sql
-- Run in Neon SQL editor before the resource feature goes live.
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  name text,
  resource text not null,
  locale text not null,
  newsletter_consent boolean not null default false
);
```

- [ ] **Step 3: Add the zod schema**

Create `src/lib/subscriber-schema.ts`:
```ts
import { z } from 'zod';

export const subscriberSchema = z.object({
  name: z.string().optional().default(''),
  email: z.email(),
  resource: z.string().min(1),
  locale: z.enum(['en', 'es']),
  newsletterConsent: z.boolean().optional().default(false),
});

export type SubscriberValues = z.infer<typeof subscriberSchema>;
export type SubscriberInput = z.input<typeof subscriberSchema>;
```

- [ ] **Step 4: Test the schema**

Create `src/lib/__tests__/subscriber-schema.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { subscriberSchema } from '../subscriber-schema';

describe('subscriberSchema', () => {
  it('accepts a valid subscription and defaults name/consent', () => {
    const r = subscriberSchema.safeParse({ email: 'a@b.com', resource: 'ai-readiness-checklist', locale: 'en' });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.name).toBe(''); expect(r.data.newsletterConsent).toBe(false); }
  });
  it('rejects a bad email', () => {
    expect(subscriberSchema.safeParse({ email: 'nope', resource: 'x', locale: 'en' }).success).toBe(false);
  });
  it('rejects an unknown locale', () => {
    expect(subscriberSchema.safeParse({ email: 'a@b.com', resource: 'x', locale: 'fr' }).success).toBe(false);
  });
});
```

- [ ] **Step 5: Run test + commit**

Run: `npx vitest run src/lib/__tests__/subscriber-schema.test.ts` → PASS.
```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: subscribers table + subscriber schema + migration SQL"
```

---

### Task 6: `processSubscription` orchestrator

**Files:**
- Create: `src/lib/subscribe/process.ts`
- Test: `src/lib/subscribe/__tests__/process.test.ts`

**Interfaces:**
- Consumes: `subscriberSchema`, `SubscriberValues` (Task 5).
- Produces: `processSubscription(input: unknown, deps: SubscribeDeps): Promise<SubscribeResult>` where `SubscribeResult = { ok: true } | { ok: false; error: 'invalid' | 'failed' }` and `SubscribeDeps = { insertSubscriber: (v: SubscriberValues) => Promise<{ id: string }>; sendResourceEmail: (v: SubscriberValues) => Promise<void> }`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/subscribe/__tests__/process.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { processSubscription } from '../process';

const valid = { email: 'a@b.com', resource: 'ai-readiness-checklist', locale: 'en' };
const ok = () => Promise.resolve({ id: '1' });
const okMail = () => Promise.resolve();

describe('processSubscription', () => {
  it('returns ok when both persistence paths succeed', async () => {
    const r = await processSubscription(valid, { insertSubscriber: ok, sendResourceEmail: okMail });
    expect(r).toEqual({ ok: true });
  });
  it('returns ok when only the DB insert succeeds', async () => {
    const r = await processSubscription(valid, { insertSubscriber: ok, sendResourceEmail: () => Promise.reject(new Error('mail')) });
    expect(r).toEqual({ ok: true });
  });
  it('returns ok when only the email succeeds', async () => {
    const r = await processSubscription(valid, { insertSubscriber: () => Promise.reject(new Error('db')), sendResourceEmail: okMail });
    expect(r).toEqual({ ok: true });
  });
  it('returns failed when both paths fail', async () => {
    const r = await processSubscription(valid, { insertSubscriber: () => Promise.reject(new Error('db')), sendResourceEmail: () => Promise.reject(new Error('mail')) });
    expect(r).toEqual({ ok: false, error: 'failed' });
  });
  it('returns invalid on a bad payload', async () => {
    const r = await processSubscription({ email: 'nope' }, { insertSubscriber: ok, sendResourceEmail: okMail });
    expect(r).toEqual({ ok: false, error: 'invalid' });
  });
  it('silently drops a honeypot hit without persisting', async () => {
    const insertSubscriber = vi.fn(ok);
    const sendResourceEmail = vi.fn(okMail);
    const r = await processSubscription({ ...valid, website: 'bot' }, { insertSubscriber, sendResourceEmail });
    expect(r).toEqual({ ok: true });
    expect(insertSubscriber).not.toHaveBeenCalled();
    expect(sendResourceEmail).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/subscribe/__tests__/process.test.ts`
Expected: FAIL — cannot resolve `../process`.

- [ ] **Step 3: Implement the orchestrator**

Create `src/lib/subscribe/process.ts`:
```ts
import { subscriberSchema, type SubscriberValues } from '@/lib/subscriber-schema';

export type SubscribeResult = { ok: true } | { ok: false; error: 'invalid' | 'failed' };

export interface SubscribeDeps {
  insertSubscriber: (v: SubscriberValues) => Promise<{ id: string }>;
  sendResourceEmail: (v: SubscriberValues) => Promise<void>;
}

export async function processSubscription(input: unknown, deps: SubscribeDeps): Promise<SubscribeResult> {
  if (input && typeof input === 'object' && 'website' in input && (input as { website?: unknown }).website) {
    return { ok: true }; // honeypot tripped — silently drop
  }

  const parsed = subscriberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const sub = parsed.data;

  const [dbResult, mailResult] = await Promise.allSettled([
    deps.insertSubscriber(sub),
    deps.sendResourceEmail(sub),
  ]);
  const captured = dbResult.status === 'fulfilled' || mailResult.status === 'fulfilled';
  if (!captured) {
    console.error('[subscribe] not captured — both paths failed', {
      dbError: dbResult.status === 'rejected' ? dbResult.reason : undefined,
      mailError: mailResult.status === 'rejected' ? mailResult.reason : undefined,
    });
    return { ok: false, error: 'failed' };
  }
  return { ok: true };
}
```

- [ ] **Step 4: Run to verify pass + commit**

Run: `npx vitest run src/lib/subscribe/__tests__/process.test.ts` → PASS.
```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: processSubscription orchestrator (never-lose-capture + honeypot)"
```

---

### Task 7: Resource data + PDF generation

**Files:**
- Create: `src/lib/resources.ts`
- Create: `scripts/build-resources.mjs`
- Modify: `package.json` (add `pdfkit` devDependency + `resources:build` script)
- Create (generated): `public/resources/ai-readiness-checklist-en.pdf`, `public/resources/ai-readiness-checklist-es.pdf`
- Modify: `messages/en.json`, `messages/es.json` (`resources` namespace)
- Test: `src/lib/__tests__/resources.test.ts`

**Interfaces:**
- Produces: `resources: Resource[]` where `Resource = { slug: string; files: { en: string; es: string } }`; `getResource(slug: string): Resource | undefined`.

- [ ] **Step 1: Add the resources data module**

Create `src/lib/resources.ts`:
```ts
export interface Resource {
  slug: string;
  files: { en: string; es: string }; // public paths
}

export const resources: Resource[] = [
  {
    slug: 'ai-readiness-checklist',
    files: {
      en: '/resources/ai-readiness-checklist-en.pdf',
      es: '/resources/ai-readiness-checklist-es.pdf',
    },
  },
];

export function getResource(slug: string): Resource | undefined {
  return resources.find((r) => r.slug === slug);
}
```

- [ ] **Step 2: Add pdfkit + build script**

Run: `npm install -D pdfkit`

Create `scripts/build-resources.mjs`:
```js
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const OUT = path.join(process.cwd(), 'public', 'resources');
fs.mkdirSync(OUT, { recursive: true });

const VIOLET = '#7c3aed';
const INK = '#171528';
const MUTED = '#4a4763';

const docs = {
  'ai-readiness-checklist-en': {
    title: 'AI Readiness Checklist',
    subtitle: 'A 5-minute self-assessment for Rio Grande Valley businesses.',
    intro: 'Check the boxes that are already true for your business. The unchecked ones are where AI and automation can help you most. Your first project should be the easiest checkbox to fill.',
    sections: [
      ['Workflows', ['We know which tasks eat the most staff time each week', 'We have repeatable, rule-based work (intake, scheduling, follow-ups)', 'Our team re-types the same information into multiple systems', 'Customers wait on us for answers we could automate']],
      ['Data', ['Our key business data lives in systems we control', 'We can export our customer/job data if we needed to', 'Records are consistent enough to search and report on']],
      ['Tools', ['We use Microsoft 365 or Google Workspace', 'Our core tools can connect to each other (APIs/integrations)', 'We are open to a bilingual AI assistant for customers or staff']],
      ['Team', ['Someone owns "how we work" and could pilot a new tool', 'Staff are comfortable trying software that saves them time', 'We serve customers in both English and Spanish']],
      ['Security', ['We use multi-factor authentication on email and key apps', 'We have backups we have actually tested', 'We know who has access to what, and remove it when people leave']],
    ],
    cta: 'Most businesses can automate their first task in under two weeks. Book a free, no-pitch assessment at bis-rgv.com and we will show you the one that pays for itself first.',
  },
  'ai-readiness-checklist-es': {
    title: 'Lista de Preparación para IA',
    subtitle: 'Una autoevaluación de 5 minutos para negocios del Valle del Río Grande.',
    intro: 'Marca las casillas que ya son ciertas para tu negocio. Las que queden sin marcar son donde la IA y la automatización pueden ayudarte más. Tu primer proyecto debe ser la casilla más fácil de llenar.',
    sections: [
      ['Flujos de trabajo', ['Sabemos qué tareas consumen más tiempo del personal cada semana', 'Tenemos trabajo repetitivo y basado en reglas (admisión, agendas, seguimientos)', 'Nuestro equipo vuelve a escribir la misma información en varios sistemas', 'Los clientes esperan por respuestas que podríamos automatizar']],
      ['Datos', ['Nuestros datos clave están en sistemas que controlamos', 'Podríamos exportar los datos de clientes/trabajos si lo necesitáramos', 'Los registros son suficientemente consistentes para buscar y reportar']],
      ['Herramientas', ['Usamos Microsoft 365 o Google Workspace', 'Nuestras herramientas principales se pueden conectar (APIs/integraciones)', 'Estamos abiertos a un asistente de IA bilingüe para clientes o personal']],
      ['Equipo', ['Alguien es responsable de "cómo trabajamos" y podría probar una herramienta nueva', 'El personal está cómodo probando software que le ahorre tiempo', 'Atendemos a clientes en inglés y español']],
      ['Seguridad', ['Usamos autenticación de múltiples factores en el correo y apps clave', 'Tenemos respaldos que de verdad hemos probado', 'Sabemos quién tiene acceso a qué, y lo quitamos cuando alguien se va']],
    ],
    cta: 'La mayoría de los negocios puede automatizar su primera tarea en menos de dos semanas. Reserva una evaluación gratuita y sin presión de venta en bis-rgv.com y te mostraremos la que se paga sola primero.',
  },
};

for (const [name, d] of Object.entries(docs)) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 56 });
  doc.pipe(fs.createWriteStream(path.join(OUT, `${name}.pdf`)));

  doc.fillColor(VIOLET).fontSize(11).font('Helvetica-Bold').text('bis>');
  doc.moveDown(0.5);
  doc.fillColor(INK).fontSize(24).font('Helvetica-Bold').text(d.title);
  doc.fillColor(MUTED).fontSize(12).font('Helvetica').text(d.subtitle);
  doc.moveDown(0.8);
  doc.fillColor(INK).fontSize(11).font('Helvetica').text(d.intro);
  doc.moveDown(0.8);

  for (const [heading, items] of d.sections) {
    doc.fillColor(VIOLET).fontSize(13).font('Helvetica-Bold').text(heading);
    doc.moveDown(0.2);
    doc.fillColor(INK).fontSize(11).font('Helvetica');
    for (const item of items) doc.text(`☐  ${item}`, { indent: 8 });
    doc.moveDown(0.6);
  }

  doc.moveDown(0.4);
  doc.fillColor(MUTED).fontSize(11).font('Helvetica-Oblique').text(d.cta);
  doc.end();
}

console.log('Resource PDFs written to public/resources/');
```

In `package.json` `scripts`, add:
```json
"resources:build": "node scripts/build-resources.mjs"
```

- [ ] **Step 3: Generate the PDFs**

Run: `npm run resources:build`
Expected: prints "Resource PDFs written to public/resources/" and creates both `.pdf` files. Confirm: `ls public/resources` shows `ai-readiness-checklist-en.pdf` and `ai-readiness-checklist-es.pdf`.

- [ ] **Step 4: Add the `resources` i18n namespace (EN)**

In `messages/en.json`, add:
```json
"resources": {
  "libraryTitle": "Free Resources",
  "libraryMetaDescription": "Free guides and checklists from Bespoke Intelligent Solutions to help Rio Grande Valley businesses get started with AI and secure IT.",
  "libraryIntro": "Practical, no-fluff guides to help you get started. Free to download.",
  "getLabel": "Get the guide",
  "detailMetaSuffix": "— Free download from Bespoke Intelligent Solutions",
  "form": {
    "nameLabel": "First name",
    "emailLabel": "Work email",
    "consentLabel": "Email me occasional tips (no spam, unsubscribe anytime).",
    "submit": "Send me the checklist",
    "sending": "Sending…",
    "success": "Done! Your download should start automatically — we also emailed you a copy.",
    "error": "Something went wrong. Please try again or email us directly.",
    "downloadFallback": "Download didn't start? Click here."
  },
  "items": {
    "ai-readiness-checklist": {
      "title": "AI Readiness Checklist",
      "blurb": "A quick self-assessment to see where AI can save your business the most time — and the first step to take.",
      "whatsInsideHeading": "What's inside",
      "point1": "15+ yes/no checkpoints across your workflows, data, tools, team, and security",
      "point2": "A simple way to see where you stand and where to start",
      "point3": "The one automation most likely to pay for itself first"
    }
  },
  "home": {
    "ctaKicker": "Free download",
    "ctaTitle": "Not ready to talk yet? Start here.",
    "ctaBody": "Grab the AI Readiness Checklist and find the first automation that pays for itself.",
    "ctaButton": "Get the free checklist"
  }
}
```

- [ ] **Step 5: Add the `resources` i18n namespace (ES)**

In `messages/es.json`, add:
```json
"resources": {
  "libraryTitle": "Recursos Gratuitos",
  "libraryMetaDescription": "Guías y listas de verificación gratuitas de Bespoke Intelligent Solutions para ayudar a los negocios del Valle del Río Grande a empezar con IA e IT seguro.",
  "libraryIntro": "Guías prácticas y sin relleno para ayudarte a empezar. Descarga gratuita.",
  "getLabel": "Obtener la guía",
  "detailMetaSuffix": "— Descarga gratuita de Bespoke Intelligent Solutions",
  "form": {
    "nameLabel": "Nombre",
    "emailLabel": "Correo de trabajo",
    "consentLabel": "Envíame consejos ocasionales (sin spam, cancela cuando quieras).",
    "submit": "Envíenme la lista",
    "sending": "Enviando…",
    "success": "¡Listo! Tu descarga debería empezar automáticamente — también te enviamos una copia por correo.",
    "error": "Algo salió mal. Inténtalo de nuevo o escríbenos directamente.",
    "downloadFallback": "¿No empezó la descarga? Haz clic aquí."
  },
  "items": {
    "ai-readiness-checklist": {
      "title": "Lista de Preparación para IA",
      "blurb": "Una autoevaluación rápida para ver dónde la IA puede ahorrarle más tiempo a tu negocio — y el primer paso a seguir.",
      "whatsInsideHeading": "Qué incluye",
      "point1": "Más de 15 puntos de sí/no sobre tus flujos de trabajo, datos, herramientas, equipo y seguridad",
      "point2": "Una forma simple de ver dónde estás y por dónde empezar",
      "point3": "La automatización con más probabilidad de pagarse sola primero"
    }
  },
  "home": {
    "ctaKicker": "Descarga gratuita",
    "ctaTitle": "¿Aún no listo para hablar? Empieza aquí.",
    "ctaBody": "Toma la Lista de Preparación para IA y encuentra la primera automatización que se paga sola.",
    "ctaButton": "Obtener la lista gratis"
  }
}
```

- [ ] **Step 6: Coverage test**

Create `src/lib/__tests__/resources.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { resources } from '../resources';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const en = read('en.json');
const es = read('es.json');

describe('resources', () => {
  it('every resource has EN+ES title/blurb and existing PDF files', () => {
    for (const r of resources) {
      expect(en.resources.items[r.slug]?.title, `en title ${r.slug}`).toBeTruthy();
      expect(en.resources.items[r.slug]?.blurb, `en blurb ${r.slug}`).toBeTruthy();
      expect(es.resources.items[r.slug]?.title, `es title ${r.slug}`).toBeTruthy();
      expect(es.resources.items[r.slug]?.blurb, `es blurb ${r.slug}`).toBeTruthy();
      for (const loc of ['en', 'es'] as const) {
        const p = path.join(process.cwd(), 'public', r.files[loc]);
        expect(fs.existsSync(p), `${loc} pdf ${r.files[loc]}`).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 7: Run test + parity + commit**

Run: `npx vitest run src/lib/__tests__/resources.test.ts` → PASS. Parity spot-check → `equal true`.
Note: the generated PDFs are committed (they are build artifacts of `resources:build`, versioned so runtime needs no PDF dependency).
```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: resource data + AI Readiness Checklist PDFs (EN/ES) + i18n"
```

---

### Task 8: Subscriber repository + resource email + server action

**Files:**
- Create: `src/lib/subscribe/repository.ts`
- Create: `src/emails/ResourceEmail.tsx`
- Modify: `src/emails/messages.ts` (add resource email strings)
- Modify: `src/lib/email/resend.ts` (add `sendResourceEmail`)
- Create: `src/app/[locale]/resources/actions.ts`
- Test: `src/lib/subscribe/__tests__/repository.test.ts`

**Interfaces:**
- Consumes: `subscribers` table (Task 5), `SubscriberValues` (Task 5), `resources`/`getResource` (Task 7), `SITE_URL` (`@/lib/seo/business`).
- Produces: `insertSubscriber(v: SubscriberValues): Promise<{ id: string }>`; `sendResourceEmail(v: SubscriberValues): Promise<void>`; `subscribeForResource(input: unknown): Promise<SubscribeResult>`.

- [ ] **Step 1: Repository (with a to-row mapping test)**

Create `src/lib/subscribe/repository.ts`:
```ts
import { db } from '@/db';
import { subscribers } from '@/db/schema';
import type { SubscriberValues } from '@/lib/subscriber-schema';

export function toSubscriberRow(v: SubscriberValues) {
  return {
    email: v.email,
    name: v.name ? v.name : null,
    resource: v.resource,
    locale: v.locale,
    newsletterConsent: v.newsletterConsent,
  };
}

export async function insertSubscriber(v: SubscriberValues): Promise<{ id: string }> {
  const [row] = await db.insert(subscribers).values(toSubscriberRow(v)).returning({ id: subscribers.id });
  return { id: row.id };
}
```

Create `src/lib/subscribe/__tests__/repository.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { toSubscriberRow } from '../repository';

describe('toSubscriberRow', () => {
  it('maps values and nulls an empty name', () => {
    const row = toSubscriberRow({ name: '', email: 'a@b.com', resource: 'ai-readiness-checklist', locale: 'en', newsletterConsent: true });
    expect(row).toEqual({ email: 'a@b.com', name: null, resource: 'ai-readiness-checklist', locale: 'en', newsletterConsent: true });
  });
  it('keeps a provided name', () => {
    const row = toSubscriberRow({ name: 'Dan', email: 'a@b.com', resource: 'x', locale: 'es', newsletterConsent: false });
    expect(row.name).toBe('Dan');
  });
});
```

- [ ] **Step 2: Resource email strings + component**

In `src/emails/messages.ts`, append:
```ts
export const resourceEmailStrings = {
  en: {
    subject: 'Your free checklist from BIS',
    greeting: (name: string) => (name ? `Hi ${name},` : 'Hi,'),
    body: 'Thanks for grabbing the AI Readiness Checklist. Your download link is below — it is yours to keep and share. When you are ready to act on it, a free, no-pitch assessment is one click away.',
    link: 'Download your checklist',
    signoff: '— Dan Lopez, Bespoke Intelligent Solutions',
  },
  es: {
    subject: 'Tu lista gratuita de BIS',
    greeting: (name: string) => (name ? `Hola ${name}:` : 'Hola:'),
    body: 'Gracias por descargar la Lista de Preparación para IA. Tu enlace de descarga está abajo — es tuyo para conservar y compartir. Cuando quieras actuar, una evaluación gratuita y sin presión de venta está a un clic.',
    link: 'Descarga tu lista',
    signoff: '— Dan Lopez, Bespoke Intelligent Solutions',
  },
} as const;

export function resourceSubject(locale: EmailLocale): string {
  return resourceEmailStrings[locale].subject;
}
```

Create `src/emails/ResourceEmail.tsx`:
```tsx
import { Html, Head, Body, Container, Text, Link } from '@react-email/components';
import { resourceEmailStrings, type EmailLocale } from './messages';

export function ResourceEmail({ locale, name, url }: { locale: EmailLocale; name: string; url: string }) {
  const t = resourceEmailStrings[locale];
  return (
    <Html lang={locale}>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', background: '#faf9ff' }}>
        <Container style={{ padding: '24px', background: '#ffffff' }}>
          <Text style={{ fontWeight: 'bold' }}>bis&gt;</Text>
          <Text>{t.greeting(name)}</Text>
          <Text>{t.body}</Text>
          <Text><Link href={url} style={{ color: '#7c3aed', fontWeight: 'bold' }}>{t.link}</Link></Text>
          <Text>{t.signoff}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResourceEmail;
```

- [ ] **Step 3: Add `sendResourceEmail` to resend.ts**

In `src/lib/email/resend.ts`, add imports at the top:
```ts
import { ResourceEmail } from '@/emails/ResourceEmail';
import { resourceSubject } from '@/emails/messages';
import { getResource } from '@/lib/resources';
import { SITE_URL } from '@/lib/seo/business';
import type { SubscriberValues } from '@/lib/subscriber-schema';
```
(Keep the existing `type EmailLocale` import from `@/emails/messages` — extend that import line to also pull `resourceSubject`.)

Append this function:
```ts
export async function sendResourceEmail(v: SubscriberValues): Promise<void> {
  const res = getResource(v.resource);
  const file = res ? res.files[v.locale] : '';
  const url = `${SITE_URL}${file}`;
  const { error } = await client().emails.send({
    from: process.env.CONTACT_FROM ?? 'onboarding@resend.dev',
    to: v.email,
    replyTo: process.env.CONTACT_REPLY_TO ?? 'bespokeintelligentsolutions@gmail.com',
    subject: resourceSubject(v.locale),
    react: ResourceEmail({ locale: v.locale, name: v.name, url }),
  });
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Server action**

Create `src/app/[locale]/resources/actions.ts`:
```ts
'use server';

import { processSubscription, type SubscribeResult } from '@/lib/subscribe/process';
import { insertSubscriber } from '@/lib/subscribe/repository';
import { sendResourceEmail } from '@/lib/email/resend';

export async function subscribeForResource(input: unknown): Promise<SubscribeResult> {
  return processSubscription(input, { insertSubscriber, sendResourceEmail });
}
```

- [ ] **Step 5: Run tests + build + commit**

Run: `npx vitest run src/lib/subscribe` → PASS. `npm run build` → succeeds (server action + imports compile). `npm run lint` → clean.
```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: subscriber repository + resource email + subscribe server action"
```

---

### Task 9: Resource form + library + detail pages + footer link + e2e

**Files:**
- Create: `src/components/resources/ResourceForm.tsx`
- Create: `src/app/[locale]/resources/page.tsx`
- Create: `src/app/[locale]/resources/[slug]/page.tsx`
- Modify: `messages/en.json`, `messages/es.json` (`footer.resources`), `src/components/layout/Footer.tsx`
- Test: `e2e/resources.spec.ts`

**Interfaces:**
- Consumes: `subscriberSchema`/`SubscriberInput`/`SubscriberValues` (Task 5), `subscribeForResource` (Task 8), `resources`/`getResource` (Task 7).
- Produces: `ResourceForm({ slug, downloadUrl }: { slug: string; downloadUrl: string })`.

- [ ] **Step 1: The client capture form**

Create `src/components/resources/ResourceForm.tsx`:
```tsx
'use client';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { track } from '@vercel/analytics';
import { subscriberSchema, type SubscriberInput, type SubscriberValues } from '@/lib/subscriber-schema';
import { subscribeForResource } from '@/app/[locale]/resources/actions';

export function ResourceForm({ slug, downloadUrl }: { slug: string; downloadUrl: string }) {
  const t = useTranslations('resources.form');
  const locale = useLocale() as 'en' | 'es';
  const [sent, setSent] = useState(false);
  const [errored, setErrored] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<SubscriberInput, unknown, SubscriberValues>({
      resolver: zodResolver(subscriberSchema),
      defaultValues: { name: '', resource: slug, locale, newsletterConsent: false },
    });

  const startDownload = () => {
    const a = document.createElement('a');
    a.href = downloadUrl; a.download = '';
    document.body.appendChild(a); a.click(); a.remove();
  };

  const onSubmit = async (values: SubscriberValues) => {
    setErrored(false);
    const result = await subscribeForResource({ ...values, website: honeypotRef.current?.value ?? '' });
    if (result.ok) {
      track('resource_download', { resource: slug });
      startDownload();
      setSent(true);
    } else {
      setErrored(true);
    }
  };

  if (sent) return (
    <div role="status" className="rounded-md bg-surface-alt p-6 text-ink">
      <p>{t('success')}</p>
      <a href={downloadUrl} className="mt-2 inline-block text-primary underline">{t('downloadFallback')}</a>
    </div>
  );

  const field = 'w-full rounded-md border border-hairline bg-surface px-3 py-2 text-ink';
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="text" tabIndex={-1} autoComplete="off" ref={honeypotRef} className="hidden" aria-hidden="true" />
      <input type="hidden" {...register('resource')} />
      <input type="hidden" {...register('locale')} />
      <div>
        <label className="text-sm font-medium text-ink">{t('nameLabel')}</label>
        <input className={field} {...register('name')} />
      </div>
      <div>
        <label className="text-sm font-medium text-ink">{t('emailLabel')}</label>
        <input type="email" className={field} {...register('email')} />
        {errors.email && <p className="mt-1 text-sm text-red-500">{t('emailLabel')}</p>}
      </div>
      <label className="flex items-start gap-2 text-sm text-ink-muted">
        <input type="checkbox" className="mt-1" {...register('newsletterConsent')} />
        <span>{t('consentLabel')}</span>
      </label>
      {errored && <p role="alert" className="text-sm text-red-500">{t('error')}</p>}
      <button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary px-6 py-3 font-bold text-on-primary disabled:opacity-60">
        {isSubmitting ? t('sending') : t('submit')}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Library index page**

Create `src/app/[locale]/resources/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo/metadata';
import { resources } from '@/lib/resources';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'resources' });
  return pageMetadata({ locale, path: '/resources', title: t('libraryTitle'), description: t('libraryMetaDescription') });
}

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'resources' });

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('libraryTitle')}</h1>
      <p className="mt-3 text-lg text-ink-muted">{t('libraryIntro')}</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {resources.map((r) => (
          <Link key={r.slug} href={`/resources/${r.slug}`} className="group block rounded-xl border border-hairline bg-surface-alt p-6 transition hover:border-primary">
            <h2 className="text-xl font-bold text-ink group-hover:text-primary">{t(`items.${r.slug}.title`)}</h2>
            <p className="mt-2 text-sm text-ink-muted">{t(`items.${r.slug}.blurb`)}</p>
            <p className="mt-4 text-sm font-semibold text-accent">{t('getLabel')} →</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Detail page (dynamic slug)**

Create `src/app/[locale]/resources/[slug]/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { resources, getResource } from '@/lib/resources';
import { ResourceForm } from '@/components/resources/ResourceForm';

export function generateStaticParams() {
  return resources.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'resources' });
  if (!getResource(slug)) return {};
  return pageMetadata({
    locale, path: `/resources/${slug}`,
    title: t(`items.${slug}.title`),
    description: `${t(`items.${slug}.blurb`)} ${t('detailMetaSuffix')}`,
  });
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const resource = getResource(slug);
  if (!resource) notFound();
  const t = await getTranslations({ locale, namespace: 'resources' });
  const downloadUrl = resource.files[locale as 'en' | 'es'];

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t(`items.${slug}.title`)}</h1>
          <p className="mt-4 text-lg text-ink-muted">{t(`items.${slug}.blurb`)}</p>
          <h2 className="mt-8 text-xs font-bold uppercase tracking-widest text-accent">{t(`items.${slug}.whatsInsideHeading`)}</h2>
          <ul className="mt-3 space-y-2 text-ink">
            <li className="flex gap-2"><span className="text-accent">✓</span>{t(`items.${slug}.point1`)}</li>
            <li className="flex gap-2"><span className="text-accent">✓</span>{t(`items.${slug}.point2`)}</li>
            <li className="flex gap-2"><span className="text-accent">✓</span>{t(`items.${slug}.point3`)}</li>
          </ul>
        </div>
        <div className="rounded-xl border border-hairline bg-surface-alt p-8">
          <ResourceForm slug={slug} downloadUrl={downloadUrl} />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Footer link**

In `messages/en.json` `footer` add `"resources": "Free Resources"`; in `messages/es.json` `footer` add `"resources": "Recursos Gratuitos"`.
In `src/components/layout/Footer.tsx`, add inside the Company `<ul>` (after the service-area line):
```tsx
            <li><Link href="/resources">{t('resources')}</Link></li>
```

- [ ] **Step 5: e2e**

Create `e2e/resources.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('resources library lists the checklist (EN)', async ({ page }) => {
  await page.goto('/en/resources');
  await expect(page.getByRole('heading', { level: 1, name: /Free Resources/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /AI Readiness Checklist/i })).toBeVisible();
});

test('resource detail shows the capture form (EN)', async ({ page }) => {
  await page.goto('/en/resources/ai-readiness-checklist');
  await expect(page.getByRole('heading', { level: 1, name: /AI Readiness Checklist/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Send me the checklist/i })).toBeVisible();
});

test('resource detail renders localized (ES)', async ({ page }) => {
  await page.goto('/es/resources/ai-readiness-checklist');
  await expect(page.getByRole('heading', { level: 1, name: /Lista de Preparación para IA/i })).toBeVisible();
});
```

- [ ] **Step 6: Verify + commit**

Run: `npm run build` → succeeds (`/[locale]/resources` + `/[locale]/resources/[slug]` prerender). `npm run lint` → clean. `npm run e2e -- resources` → 3 passed.
```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: resource form + library + detail pages + footer link + e2e"
```

---

### Task 10: Home CTA + full verification

**Files:**
- Create: `src/components/marketing/ResourceCTA.tsx`
- Modify: `src/app/[locale]/page.tsx` (mount the CTA)

**Interfaces:**
- Consumes: `resources.home.*` i18n (Task 7), `Link`.
- Produces: `ResourceCTA({ kicker, title, body, button, href }: { kicker: string; title: string; body: string; button: string; href: string })`.

- [ ] **Step 1: The CTA block**

Create `src/components/marketing/ResourceCTA.tsx`:
```tsx
import { Link } from '@/i18n/navigation';

export function ResourceCTA({ kicker, title, body, button, href }: { kicker: string; title: string; body: string; button: string; href: string }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="rounded-2xl border border-hairline bg-surface-alt p-10 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">{kicker}</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-muted">{body}</p>
        <Link href={href} className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-on-primary">{button}</Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Mount on home**

In `src/app/[locale]/page.tsx`:
- Add import: `import { ResourceCTA } from '@/components/marketing/ResourceCTA';`
- Add a resources translator inside the component (near the other `getTranslations` calls): `const r = await getTranslations({ locale, namespace: 'resources' });`
- Insert the CTA between the quote `<section>` and the Insights `<section>`:
```tsx
      <ResourceCTA
        kicker={r('home.ctaKicker')}
        title={r('home.ctaTitle')}
        body={r('home.ctaBody')}
        button={r('home.ctaButton')}
        href="/resources/ai-readiness-checklist"
      />
```

- [ ] **Step 3: Full verification**

Run parity spot-check → `equal true`. Run: `npx vitest run` → all pass (pre-existing `src/lib/email/__tests__/resend.test.ts` may flake only under full-suite parallelism — confirm it passes in isolation via `npx vitest run src/lib/email` if it appears). `npm run build` → succeeds; all new routes prerender. `npm run lint` → clean. `npm run e2e -- faq service-area resources` → all pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: resource CTA on home + full growth-pack verification"
```

---

## Post-implementation owner checklist (surface at hand-off)
- Create the `subscribers` table in Neon using `docs/migrations/2026-07-12-subscribers.sql` **before** the resource form is used in prod.
- Review AI-drafted EN/ES copy (FAQ, service-area, checklist PDFs).
- Confirm the city list and (still-placeholder) business phone in `business.ts`.
- After deploy: one live smoke — submit the resource form, confirm a `subscribers` row + the confirmation email + the PDF download.

## Self-review notes (addressed)
- **Spec coverage:** FAQ page + FAQPage JSON-LD + i18n + footer (Tasks 1–2); service-area hub + areaServed JSON-LD + expanded city list + footer (Tasks 3–4); subscribers table (5), pure `processSubscription` orchestrator mirroring contact (6), extensible resource list + generated bilingual PDFs (7), repository + Resend email + server action (8), capture form + library + dynamic detail page + footer + home CTA (9–10). All spec sections map to tasks.
- **Contact-seam parity:** `processSubscription` mirrors `processContactSubmission` (honeypot drop, never-lose-capture, injected deps) so it's unit-testable with no DB/Resend.
- **Build-safety:** the subscribe server action imports `@/db` the same way the existing contact action does (builds fine); no route handler evaluates DB at module load.
- **Type consistency:** `SubscriberValues`/`SubscriberInput`, `SubscribeDeps`, `SubscribeResult`, `Resource`/`getResource`, and `ResourceForm({slug,downloadUrl})` are defined once and consumed with identical names/shapes across tasks.
- **i18n parity:** every new namespace has a coverage test asserting EN+ES keys; PDFs verified to exist by the resources test.
- **No placeholders:** all copy (EN/ES), PDF content, and code are inline and complete.
