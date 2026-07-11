# Phase 3a — Bilingual Insights Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fully-bilingual (EN/ES) `/insights` blog authored as in-repo MDX, and rewire the home "What we think" teasers + nav to real posts.

**Architecture:** MDX files live in `src/content/insights/{en,es}/<slug>.mdx` with a typed `export const metadata`. A small `src/lib/insights` library reads the directory (`fs`) for slugs/parity and dynamically imports posts for their metadata/content. Two SSG routes (listing + post) render them; the home page shows the latest 3. Build-time parity (a Vitest test) fails if a slug lacks its EN or ES pair.

**Tech Stack:** Next 16 App Router · `@next/mdx` (`createMDX`) composed with the existing `next-intl` plugin · next-intl v4 · Tailwind v4 · Vitest + Playwright.

## Global Constraints

- Work from repo root `C:\Users\danlo\BIS-Website`. Node 24, npm.
- **Modified Next 16 (AGENTS.md):** before writing config/routes, read `node_modules/next/dist/docs/01-app/02-guides/mdx.md` and the installed `@next/mdx` README; verify the `createMDX`+`withNextIntl` composition, whether `pageExtensions` is required, and the dynamic-import + `export const metadata` pattern against the installed version. Note deviations in the report.
- **Preserve `next.config.ts`:** it currently exports `withNextIntl(nextConfig)` AND holds the www→apex `redirects()` rule — both must survive.
- `@next/mdx` App Router **requires** a root `mdx-components.tsx` or MDX will not render.
- Path alias: `@/*` → `./src/*`. Content is under `src/content/`, so `@/content/...` resolves and posts do NOT become routes on their own.
- Content library is build-time/RSC only — never import it into a client component.
- **Bilingual parity is mandatory:** every slug exists in `en/` AND `es/`. The parity Vitest test must stay green.
- **No fabrication:** seed posts are genuine opinion/education. No invented stats, client names, results, or testimonials. ES is AI-drafted for owner review.
- Repo test convention: **native Vitest matchers only** (no jest-dom). Reuse `pageMetadata` from `@/lib/seo/metadata` for canonical/hreflang/OG.
- Commit after each task with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit`.
- Every task ends green: `npm run lint` clean, `npm run build` succeeds, relevant tests pass.

---

### Task 1: MDX foundation (deps + config + mdx-components)

**Files:**
- Modify: `package.json` (add `@next/mdx @mdx-js/loader @mdx-js/react @types/mdx`)
- Modify: `next.config.ts`
- Create: `mdx-components.tsx` (repo root)

**Interfaces:**
- Produces: a configured MDX pipeline so `.mdx` files can be imported and rendered; root `useMDXComponents`.

- [ ] **Step 1: Install deps**

```bash
cd "C:/Users/danlo/BIS-Website"
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

- [ ] **Step 2: Read the MDX guide to confirm the installed API**

Read `node_modules/next/dist/docs/01-app/02-guides/mdx.md` and `node_modules/@next/mdx/readme.md` (or `package.json` version). Confirm: `createMDX` default export, `useMDXComponents` signature, whether `pageExtensions` must include `md`/`mdx`.

- [ ] **Step 3: Compose `createMDX` with `withNextIntl` (preserve the redirect)**

Replace `next.config.ts` with (adapt names to the installed API if the doc differs):

```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import createMDX from '@next/mdx';

const withNextIntl = createNextIntlPlugin();
const withMDX = createMDX();

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  async redirects() {
    return [
      // Canonicalize www -> apex (301/308) so bis-rgv.com is the single origin.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.bis-rgv.com' }],
        destination: 'https://bis-rgv.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default withMDX(withNextIntl(nextConfig));
```

- [ ] **Step 4: Create the root `mdx-components.tsx`**

```tsx
import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: (p) => <h2 className="mt-10 text-2xl font-bold text-ink" {...p} />,
    h3: (p) => <h3 className="mt-8 text-xl font-bold text-ink" {...p} />,
    p: (p) => <p className="mt-4 leading-relaxed text-ink-muted" {...p} />,
    ul: (p) => <ul className="mt-4 list-disc space-y-2 pl-6 text-ink-muted" {...p} />,
    ol: (p) => <ol className="mt-4 list-decimal space-y-2 pl-6 text-ink-muted" {...p} />,
    li: (p) => <li className="leading-relaxed" {...p} />,
    a: (p) => <a className="text-primary underline underline-offset-2" {...p} />,
    blockquote: (p) => <blockquote className="mt-6 border-l-2 border-primary pl-4 italic text-ink" {...p} />,
    strong: (p) => <strong className="font-bold text-ink" {...p} />,
    ...components,
  };
}
```

- [ ] **Step 5: Verify build + lint stay green**

Run: `npm run lint` → clean. `npm run build` → succeeds (no MDX imported yet; this only proves the config composes).

- [ ] **Step 6: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: MDX foundation (@next/mdx composed with next-intl, mdx-components)"
```

---

### Task 2: Content library + first seed post (with parity test)

**Files:**
- Create: `src/content/insights/en/find-your-first-hour-back.mdx`
- Create: `src/content/insights/es/find-your-first-hour-back.mdx`
- Create: `src/lib/insights/index.ts`
- Test: `src/lib/insights/__tests__/index.test.ts`

**Interfaces:**
- Consumes: MDX pipeline (Task 1).
- Produces:
  - `type Locale = 'en' | 'es'`; `type Category = 'Insights'|'Security'|'Culture'|'AI'`; `interface PostMeta { slug; title; description; category: Category; date: string; readingMinutes: number }`
  - `allSlugs(): string[]` (sync, fs)
  - `missingTranslations(): { slug: string; missing: Locale }[]` (sync, fs)
  - `sortByDateDesc<T extends { date: string }>(items: T[]): T[]` (pure)
  - `formatDate(locale: Locale, iso: string): string`
  - `listPosts(locale: Locale): Promise<PostMeta[]>`
  - `getPost(locale, slug): Promise<{ Content: ComponentType; meta: PostMeta } | null>`

- [ ] **Step 1: Create the first seed post (EN)**

Create `src/content/insights/en/find-your-first-hour-back.mdx`:

```mdx
export const metadata = {
  title: 'Find your first hour back',
  description: 'The fastest ROI from AI is not a moonshot — it is the one repetitive task quietly eating your week. Here is how to spot it.',
  category: 'Insights',
  date: '2026-07-11',
  readingMinutes: 3,
};

Most businesses meet AI through the headlines: agents that replace teams, models that do everything. That framing is exciting and almost always wrong for a working business in the Rio Grande Valley. The real gains start much smaller.

## Start with the hour you lose every day

Somewhere in your week is a task you repeat without thinking: re-typing intake details, chasing the same follow-up email, copying numbers between two systems that were never introduced. It is boring, it is manual, and it is exactly where automation pays for itself first.

We call finding it the "first hour back." Not a transformation program — one hour, reclaimed reliably, every day. Once that hour is yours again, the next one is easier to find.

## How to spot yours

- Look for work that follows the same steps every time.
- Look for the copy-paste between two tools.
- Look for the thing your team quietly dreads on Monday morning.

If a task is repeatable, it is usually automatable. The question is never whether AI *can* help — it is which hour to win back first.

That is the whole point of a free assessment: we look at how your business actually runs, and we show you the one automation that pays for itself before you commit to anything.
```

- [ ] **Step 2: Create the first seed post (ES)**

Create `src/content/insights/es/find-your-first-hour-back.mdx`:

```mdx
export const metadata = {
  title: 'Recupera tu primera hora',
  description: 'El mejor retorno de la IA no es un gran salto — es esa tarea repetitiva que consume tu semana en silencio. Así la identificas.',
  category: 'Insights',
  date: '2026-07-11',
  readingMinutes: 3,
};

La mayoría de los negocios conoce la IA por los titulares: agentes que reemplazan equipos, modelos que lo hacen todo. Ese enfoque emociona y casi siempre es el equivocado para un negocio real del Valle del Río Grande. Las ganancias de verdad empiezan mucho más pequeñas.

## Empieza por la hora que pierdes cada día

En algún punto de tu semana hay una tarea que repites sin pensar: volver a capturar datos de admisión, perseguir el mismo correo de seguimiento, copiar números entre dos sistemas que nunca se conocieron. Es tediosa, es manual, y es justo ahí donde la automatización se paga sola primero.

A encontrarla le llamamos "recuperar la primera hora". No es un programa de transformación — es una hora, recuperada de forma confiable, todos los días. Una vez que esa hora vuelve a ser tuya, la siguiente es más fácil de encontrar.

## Cómo identificar la tuya

- Busca el trabajo que sigue los mismos pasos siempre.
- Busca el copiar y pegar entre dos herramientas.
- Busca eso que tu equipo teme en silencio el lunes por la mañana.

Si una tarea es repetible, normalmente es automatizable. La pregunta nunca es si la IA *puede* ayudar — es qué hora recuperar primero.

Ese es todo el sentido de una evaluación gratuita: analizamos cómo funciona tu negocio de verdad y te mostramos la primera automatización que se paga sola, antes de que te comprometas a nada.
```

- [ ] **Step 3: Write the failing content-library test**

Create `src/lib/insights/__tests__/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { allSlugs, missingTranslations, sortByDateDesc } from '../index';

describe('insights content library', () => {
  it('has both language files for every post (parity)', () => {
    expect(missingTranslations()).toEqual([]);
  });

  it('lists the seeded slug', () => {
    expect(allSlugs()).toContain('find-your-first-hour-back');
  });

  it('sorts posts by date descending', () => {
    const sorted = sortByDateDesc([
      { date: '2026-01-01', slug: 'a' },
      { date: '2026-03-01', slug: 'b' },
      { date: '2026-02-01', slug: 'c' },
    ]);
    expect(sorted.map((p) => p.slug)).toEqual(['b', 'c', 'a']);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/lib/insights`
Expected: FAIL — cannot resolve `../index`.

- [ ] **Step 5: Implement the content library**

Create `src/lib/insights/index.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import type { ComponentType } from 'react';

export type Locale = 'en' | 'es';
export const CATEGORIES = ['Insights', 'Security', 'Culture', 'AI'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  category: Category;
  date: string; // 'YYYY-MM-DD'
  readingMinutes: number;
}

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'insights');

function slugsFor(locale: Locale): string[] {
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''));
}

export function allSlugs(): string[] {
  return [...new Set([...slugsFor('en'), ...slugsFor('es')])].sort();
}

export function missingTranslations(): { slug: string; missing: Locale }[] {
  const en = new Set(slugsFor('en'));
  const es = new Set(slugsFor('es'));
  const out: { slug: string; missing: Locale }[] = [];
  for (const s of allSlugs()) {
    if (!en.has(s)) out.push({ slug: s, missing: 'en' });
    if (!es.has(s)) out.push({ slug: s, missing: 'es' });
  }
  return out;
}

export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function formatDate(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    .format(new Date(`${iso}T00:00:00`));
}

interface MdxModule {
  default: ComponentType;
  metadata: Omit<PostMeta, 'slug'>;
}

async function importPost(locale: Locale, slug: string): Promise<MdxModule | null> {
  try {
    return (await import(`@/content/insights/${locale}/${slug}.mdx`)) as MdxModule;
  } catch {
    return null;
  }
}

export async function listPosts(locale: Locale): Promise<PostMeta[]> {
  const metas = await Promise.all(
    slugsFor(locale).map(async (slug) => {
      const mod = await importPost(locale, slug);
      return mod ? { slug, ...mod.metadata } : null;
    }),
  );
  return sortByDateDesc(metas.filter((m): m is PostMeta => m !== null));
}

export async function getPost(
  locale: Locale,
  slug: string,
): Promise<{ Content: ComponentType; meta: PostMeta } | null> {
  const mod = await importPost(locale, slug);
  if (!mod) return null;
  return { Content: mod.default, meta: { slug, ...mod.metadata } };
}
```

> **Bundler note:** the variable dynamic import `import(\`@/content/insights/${locale}/${slug}.mdx\`)` mirrors the pattern in the Next MDX guide (`await import(\`@/content/${slug}.mdx\`)`). If the installed Turbopack cannot resolve the alias+variable context at build, switch the base to a relative path (`../../content/insights/...`); if it still fails, fall back to an explicit `Record<string, () => Promise<MdxModule>>` registry keyed by `${locale}/${slug}`. Note whichever you used.

- [ ] **Step 6: Run tests + verify build**

Run: `npx vitest run src/lib/insights` → 3 pass. `npm run build` → succeeds. `npm run lint` → clean.

- [ ] **Step 7: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: insights content library + first bilingual seed post + parity test"
```

---

### Task 3: InsightCard becomes a link + rewire home + nav + i18n

**Files:**
- Modify: `src/components/marketing/InsightCard.tsx`
- Test: `src/components/marketing/__tests__/InsightCard.test.tsx`
- Modify: `src/app/[locale]/page.tsx` (home "What we think" section)
- Modify: `src/components/layout/Header.tsx`, `src/components/layout/MobileNav.tsx`
- Modify: `messages/en.json`, `messages/es.json`

**Interfaces:**
- Consumes: `listPosts`, `formatDate` (Task 2).
- Produces: `InsightCard` with props `{ href: string; category: string; title: string; date?: string; minReadLabel?: string }`.

- [ ] **Step 1: Add the `insights` namespace + `nav.insights` (EN)**

In `messages/en.json`, add to the existing `nav` object: `"insights": "Insights"`. Then add a new top-level `insights` namespace:

```json
"insights": {
  "heading": "Insights",
  "subheading": "Ideas on AI, IT, and web for Rio Grande Valley businesses.",
  "readArticle": "Read article",
  "minRead": "{minutes} min read",
  "backToInsights": "← Back to insights",
  "emptyState": "No posts yet — check back soon.",
  "categories": { "Insights": "Insights", "Security": "Security", "Culture": "Culture", "AI": "AI" }
}
```

- [ ] **Step 2: Add the `insights` namespace + `nav.insights` (ES)**

In `messages/es.json`, add to `nav`: `"insights": "Perspectivas"`. Then add:

```json
"insights": {
  "heading": "Perspectivas",
  "subheading": "Ideas sobre IA, IT y web para los negocios del Valle del Río Grande.",
  "readArticle": "Leer artículo",
  "minRead": "{minutes} min de lectura",
  "backToInsights": "← Volver a Perspectivas",
  "emptyState": "Aún no hay publicaciones — vuelve pronto.",
  "categories": { "Insights": "Perspectivas", "Security": "Seguridad", "Culture": "Cultura", "AI": "IA" }
}
```

- [ ] **Step 3: Remove the now-dead home teaser keys**

In BOTH `messages/en.json` and `messages/es.json`, delete these keys from the `home` namespace: `post1Cat`, `post1Title`, `post2Cat`, `post2Title`, `post3Cat`, `post3Title`, `post4Cat`, `post4Title`. Keep `insightsHeading`.

- [ ] **Step 4: Write the failing InsightCard test**

Create `src/components/marketing/__tests__/InsightCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsightCard } from '../InsightCard';

describe('InsightCard', () => {
  it('renders a link to the post with title, category, and meta', () => {
    render(
      <InsightCard href="/insights/hello" category="Insights" title="Hello World"
        date="July 1, 2026" minReadLabel="3 min read" />,
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toContain('/insights/hello');
    expect(screen.getByRole('heading', { name: 'Hello World' })).toBeTruthy();
    expect(screen.getByText('Insights')).toBeTruthy();
    expect(screen.getByText(/3 min read/)).toBeTruthy();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run src/components/marketing/__tests__/InsightCard.test.tsx`
Expected: FAIL — current `InsightCard` takes only `{ category, title }` and renders no link.

- [ ] **Step 6: Reimplement InsightCard as a link**

Replace `src/components/marketing/InsightCard.tsx`:

```tsx
import { Link } from '@/i18n/navigation';

export function InsightCard({
  href, category, title, date, minReadLabel,
}: { href: string; category: string; title: string; date?: string; minReadLabel?: string }) {
  const meta = [date, minReadLabel].filter(Boolean).join(' · ');
  return (
    <Link href={href} className="group block rounded-xl border border-hairline bg-surface-alt p-6 transition hover:border-primary">
      <p className="text-xs font-bold uppercase tracking-widest text-gold">{category}</p>
      <h3 className="mt-3 text-lg font-bold text-ink group-hover:text-primary">{title}</h3>
      {meta && <p className="mt-3 text-xs text-ink-muted">{meta}</p>}
    </Link>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/components/marketing/__tests__/InsightCard.test.tsx`
Expected: PASS.

- [ ] **Step 8: Rewire the home "What we think" section**

In `src/app/[locale]/page.tsx`: add imports `import { listPosts, formatDate } from '@/lib/insights';`. In the component body (after `const { locale } = await params;` and existing translation setup), add:

```tsx
  const it = await getTranslations({ locale, namespace: 'insights' });
  const latest = (await listPosts(locale)).slice(0, 3);
```

Replace the insights `<section>` (the one with `SectionHeading title={t('insightsHeading')}` and the four `<InsightCard .../>`) with:

```tsx
      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading title={t('insightsHeading')} />
        {latest.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {latest.map((p) => (
              <InsightCard
                key={p.slug}
                href={`/insights/${p.slug}`}
                category={it(`categories.${p.category}`)}
                title={p.title}
                date={formatDate(locale, p.date)}
                minReadLabel={it('minRead', { minutes: p.readingMinutes })}
              />
            ))}
          </div>
        )}
      </section>
```

> `locale` here is typed `string`; `formatDate`/`listPosts` expect `Locale`. Cast at the call site: `listPosts(locale as 'en' | 'es')` and `formatDate(locale as 'en' | 'es', p.date)` (the `[locale]` route only ever serves configured locales).

- [ ] **Step 9: Add "Insights" to Header nav**

In `src/components/layout/Header.tsx`, add to the `items` array after the `about` entry (or before `contact`):

```tsx
    { href: '/insights', label: t('insights') },
```

- [ ] **Step 10: Add "Insights" to MobileNav**

In `src/components/layout/MobileNav.tsx`, add the identical entry to its `items` array:

```tsx
    { href: '/insights', label: t('insights') },
```

- [ ] **Step 11: Verify parity, tests, build, lint**

Run i18n parity:
```bash
node -e "const a=require('./messages/en.json'),b=require('./messages/es.json');const k=o=>Object.entries(o).flatMap(([n,v])=>typeof v==='object'&&v?Object.keys(v).map(x=>n+'.'+x):[n]).sort();console.log('equal',JSON.stringify(k(a))===JSON.stringify(k(b)));"
```
Expected: `equal true`.
Run: `npx vitest run` → all pass. `npm run build` → succeeds (home renders 1 post via `listPosts`; this is the first build that compiles MDX). `npm run lint` → clean.

- [ ] **Step 12: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: InsightCard links, home shows latest posts, Insights nav + i18n"
```

---

### Task 4: Insights listing route

**Files:**
- Create: `src/app/[locale]/insights/page.tsx`

**Interfaces:**
- Consumes: `listPosts`, `formatDate` (Task 2); `InsightCard` (Task 3); `pageMetadata` (`@/lib/seo/metadata`).

- [ ] **Step 1: Create the listing route**

Create `src/app/[locale]/insights/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { InsightCard } from '@/components/marketing/InsightCard';
import { pageMetadata } from '@/lib/seo/metadata';
import { listPosts, formatDate } from '@/lib/insights';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'insights' });
  return pageMetadata({ locale, path: '/insights', title: t('heading'), description: t('subheading') });
}

export default async function InsightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'insights' });
  const loc = locale as 'en' | 'es';
  const posts = await listPosts(loc);

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-extrabold text-ink">{t('heading')}</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">{t('subheading')}</p>
      {posts.length === 0 ? (
        <p className="mt-10 text-ink-muted">{t('emptyState')}</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((p) => (
            <InsightCard
              key={p.slug}
              href={`/insights/${p.slug}`}
              category={t(`categories.${p.category}`)}
              title={p.title}
              date={formatDate(loc, p.date)}
              minReadLabel={t('minRead', { minutes: p.readingMinutes })}
            />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify build + lint + manual route presence**

Run: `npm run build` → succeeds and the output lists `/[locale]/insights`. `npm run lint` → clean.

- [ ] **Step 3: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: /insights listing route (bilingual, SSG)"
```

---

### Task 5: Insights post route

**Files:**
- Create: `src/app/[locale]/insights/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getPost`, `allSlugs`, `formatDate` (Task 2); `pageMetadata` (`@/lib/seo/metadata`); `notFound` (`next/navigation`).

- [ ] **Step 1: Create the post route**

Create `src/app/[locale]/insights/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo/metadata';
import { getPost, allSlugs, formatDate } from '@/lib/insights';

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> },
): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(locale as 'en' | 'es', slug);
  if (!post) return {};
  return pageMetadata({ locale, path: `/insights/${slug}`, title: post.meta.title, description: post.meta.description });
}

export default async function InsightPostPage(
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as 'en' | 'es';
  const post = await getPost(loc, slug);
  if (!post) notFound();
  const { Content, meta } = post;
  const t = await getTranslations({ locale, namespace: 'insights' });

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <Link href="/insights" className="text-sm text-primary hover:underline">{t('backToInsights')}</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-widest text-gold">{t(`categories.${meta.category}`)}</p>
      <h1 className="mt-3 text-4xl font-extrabold leading-tight text-ink">{meta.title}</h1>
      <p className="mt-3 text-sm text-ink-muted">
        {formatDate(loc, meta.date)} · {t('minRead', { minutes: meta.readingMinutes })}
      </p>
      <article className="mt-8">
        <Content />
      </article>
    </main>
  );
}
```

- [ ] **Step 2: Verify build renders the post + lint**

Run: `npm run build` → succeeds; output shows `/[locale]/insights/[slug]` with the seeded slug prerendered. `npm run lint` → clean.

- [ ] **Step 3: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: /insights/[slug] post route (MDX render, hreflang, static params)"
```

---

### Task 6: Second seed post + e2e + full verification

**Files:**
- Create: `src/content/insights/en/bilingual-by-design.mdx`, `src/content/insights/es/bilingual-by-design.mdx`
- Create: `e2e/insights.spec.ts`

**Interfaces:**
- Consumes: everything above. The parity test (Task 2) now also guards this post.

- [ ] **Step 1: Create the second seed post (EN)**

Create `src/content/insights/en/bilingual-by-design.mdx`:

```mdx
export const metadata = {
  title: 'Bilingual by design, not by translation',
  description: 'In the Valley, "add Spanish later" quietly costs you customers. Building in both languages from the start is a growth decision, not a courtesy.',
  category: 'Culture',
  date: '2026-07-09',
  readingMinutes: 4,
};

Plenty of Valley businesses run on two languages every day at the counter, then publish a website that only speaks one. The Spanish version, when it exists, is usually an afterthought: machine-translated, bolted on, a little off. Customers notice.

## Translation is not the same as belonging

A translated page tells a customer you were willing to include them. A page built bilingually tells them it was built for them. The difference is felt, not read — in the phrasing, the examples, the tone. "En español" as a footnote reads differently than a site that simply works in the language you think in.

## Why it is a growth lever

- The customer who was going to bounce stays, because the page speaks to them.
- Your team stops manually bridging the gap on every call and form.
- Search engines index both languages as first-class, so you show up for how people actually search.

Building in two languages from day one costs a little more attention up front and saves a lot of retrofitting later. It is the same principle as security or automation: cheaper to design in than to bolt on.

That is why every BIS build ships bilingual by default. Not as a feature to upsell — as the baseline for doing business in the Valley.
```

- [ ] **Step 2: Create the second seed post (ES)**

Create `src/content/insights/es/bilingual-by-design.mdx`:

```mdx
export const metadata = {
  title: 'Bilingüe por diseño, no por traducción',
  description: 'En el Valle, "agregar el español después" te cuesta clientes en silencio. Construir en ambos idiomas desde el inicio es una decisión de crecimiento, no una cortesía.',
  category: 'Culture',
  date: '2026-07-09',
  readingMinutes: 4,
};

Muchos negocios del Valle funcionan en dos idiomas todos los días en el mostrador, y luego publican un sitio web que solo habla uno. La versión en español, cuando existe, suele ser una ocurrencia tardía: traducida por máquina, añadida a la fuerza, un poco rara. Los clientes lo notan.

## Traducir no es lo mismo que pertenecer

Una página traducida le dice al cliente que estuviste dispuesto a incluirlo. Una página construida de forma bilingüe le dice que se construyó para él. La diferencia se siente, no se lee — en la manera de decir las cosas, en los ejemplos, en el tono. "En español" como nota al pie se lee distinto que un sitio que simplemente funciona en el idioma en el que piensas.

## Por qué es una palanca de crecimiento

- El cliente que se iba a ir se queda, porque la página le habla.
- Tu equipo deja de cerrar la brecha a mano en cada llamada y cada formulario.
- Los buscadores indexan ambos idiomas como primera clase, así que apareces según cómo la gente busca de verdad.

Construir en dos idiomas desde el primer día cuesta un poco más de atención al inicio y ahorra mucho trabajo de reajuste después. Es el mismo principio que la seguridad o la automatización: más barato diseñarlo desde dentro que añadirlo a la fuerza.

Por eso cada proyecto de BIS se entrega bilingüe por defecto. No como una función para venderte de más — sino como la base para hacer negocios en el Valle.
```

- [ ] **Step 3: Write the insights e2e**

Create `e2e/insights.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('EN insights lists posts and opens one', async ({ page }) => {
  await page.goto('/en/insights');
  const card = page.getByRole('link', { name: /first hour back/i }).first();
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.getByRole('heading', { level: 1, name: /first hour back/i })).toBeVisible();
});

test('ES insights renders a localized post', async ({ page }) => {
  await page.goto('/es/insights');
  await expect(page.getByRole('heading', { level: 1, name: /Perspectivas/i })).toBeVisible();
  await page.getByRole('link', { name: /primera hora/i }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: /primera hora/i })).toBeVisible();
});
```

- [ ] **Step 4: Full verification**

Run parity (from Task 3 Step 11) → `equal true`.
Run: `npx vitest run` → all pass (parity test still `[]` with 2 posts). `npm run build` → succeeds, both slugs prerendered in EN + ES. `npm run lint` → clean. `npm run e2e -- insights` → 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: second bilingual seed post + insights e2e"
```

---

## Self-review notes (addressed)

- **Spec coverage:** `@next/mdx` foundation (Task 1); content model + `src/lib/insights` + typed metadata (Task 2); enforced parity via a real Vitest test (Task 2, guards all later posts); listing route (Task 4); post route with generateStaticParams + hreflang via `pageMetadata` + OG (Task 5); home rewire + nav + `InsightCard` link + `insights` i18n, post1–4 keys removed (Task 3); 2 genuine bilingual seed posts (Tasks 2, 6); testing — parity + content-lib + card units, MDX build, insights e2e (throughout + Task 6).
- **MDX not unit-tested in Vitest:** Vitest does not transform `.mdx`; the fs/pure logic (`allSlugs`/`missingTranslations`/`sortByDateDesc`) is unit-tested, and actual MDX rendering is verified by `npm run build` + Playwright e2e. This is intentional (no MDX loader added to Vitest).
- **Type consistency:** `Locale`, `Category`, `PostMeta`, `allSlugs`, `missingTranslations`, `sortByDateDesc`, `formatDate`, `listPosts`, `getPost` are defined in Task 2 and consumed with matching signatures in Tasks 3–5. `InsightCard` prop shape defined in Task 3 and used identically in Tasks 3 (home) and 4 (listing).
- **Task-boundary build-green caveat:** after Task 3 the nav shows an **Insights** link whose route lands in Task 4 (a temporary dead link between tasks; build stays green). If executing with review gates that click the nav, land Tasks 4–5 before manual QA.
- **Owner follow-up:** ES copy is AI-drafted — owner reviews. Publishing new posts = add an EN+ES `.mdx` pair and push (auto-deploy); the parity test blocks a one-language post.
