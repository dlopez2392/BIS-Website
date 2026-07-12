# Tech Marquee Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A rotating (seamless infinite auto-scroll) monochrome logo strip — "Platforms we work with" — of ~24 curated brands on the home page.

**Architecture:** A typed logo list + copied SVG assets feed a pure-CSS marquee (server component, no client JS). Logos are CSS-masked silhouettes tinted with `currentColor` (theme-adaptive, uniform monochrome). The track is duplicated for a seamless loop; hover pauses it; `prefers-reduced-motion` collapses it to a static wrapping grid.

**Tech Stack:** Next 16 App Router · next-intl v4 · Tailwind v4 (CSS-first, keyframes in `globals.css`) · `simple-icons` (dev-only, for sourcing SVGs) · Vitest + Playwright.

## Global Constraints

- Work from repo root `C:\Users\danlo\BIS-Website`. Node 24, npm. Branch: create `feat/tech-marquee` off `main` (do not work on `main`).
- **Honest framing:** label is exactly EN "Platforms we work with" / ES "Plataformas y herramientas con las que trabajamos". Never "partners"/"trusted by".
- **No broken/placeholder logos:** only include a brand whose SVG actually landed in `public/logos/`. Brands not found are OMITTED from the shipped roster and listed in the report for the owner to supply later — never shipped as a broken mask or a text placeholder.
- **Monochrome via CSS mask** (`mask-image` + `-webkit-mask-image`), tinted with the design tokens (`bg-ink-muted` → `bg-ink` on hover) so logos adapt to light/dark.
- **Accessibility:** each visible logo has an accessible name (`role="img"` + `aria-label`); the duplicated loop copy is `aria-hidden` and carries no role/label. Honor `prefers-reduced-motion`.
- `simple-icons` is a **dev-only** sourcing tool; after copying the SVGs it is uninstalled so nothing ships in runtime deps (keep deps lean).
- Repo test convention: **native Vitest matchers only** (no jest-dom). Reuse existing design tokens (`text-ink`, `text-ink-muted`, `bg-surface-alt`, `border-hairline`).
- Commit after each task with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit`.
- Every task ends green: `npm run lint` clean, `npm run build` succeeds, relevant tests pass.

---

### Task 1: Source logos + typed roster (with gap report)

**Files:**
- Create: `public/logos/*.svg` (the sourced brand marks)
- Create: `src/lib/tech/logos.ts`
- Touch: `package.json`/`package-lock.json` (temporary `simple-icons` dev dep, removed by end of task)

**Interfaces:**
- Produces: `interface TechLogo { name: string; file: string }` and `export const techLogos: TechLogo[]` — the single source of truth consumed by Task 2. `file` is the SVG basename in `public/logos/` (e.g. `cisco` → `/logos/cisco.svg`).

- [ ] **Step 1: Install the sourcing tool**

```bash
cd "C:/Users/danlo/BIS-Website"
npm install -D simple-icons
```

- [ ] **Step 2: Copy the available curated SVGs into `public/logos/`**

`simple-icons` stores each mark at `node_modules/simple-icons/icons/<slug>.svg`. Copy the curated set; print which slugs exist and which are MISSING. Run this from the repo root (Git Bash):

```bash
mkdir -p public/logos
# "ourfile:slug" — ourfile is the basename we reference; slug is the simple-icons filename
pairs="microsoft:microsoft azure:microsoftazure aws:amazonwebservices googleworkspace:google vmware:vmware cisco:cisco fortinet:fortinet ubiquiti:ubiquiti crowdstrike:crowdstrike proofpoint:proofpoint malwarebytes:malwarebytes bitdefender:bitdefender datto:datto veeam:veeam synology:synology teamviewer:teamviewer zoom:zoom ringcentral:ringcentral salesforce:salesforce adobe:adobe dropbox:dropbox github:github openai:openai anthropic:anthropic supabase:supabase python:python dell:dell hp:hp lenovo:lenovo apple:apple"
for p in $pairs; do
  ourfile="${p%%:*}"; slug="${p##*:}"
  src="node_modules/simple-icons/icons/${slug}.svg"
  if [ -f "$src" ]; then cp "$src" "public/logos/${ourfile}.svg"; echo "OK   ${ourfile} (${slug})"; else echo "MISS ${ourfile} (${slug})"; fi
done
```

Record the full OK/MISS output in your report. The MISS list is the owner gap report.

- [ ] **Step 3: Write `src/lib/tech/logos.ts` from the OK set only**

Include an entry ONLY for each brand that printed `OK` (a file now exists at `public/logos/<file>.svg`). Use the human brand name (with correct casing) for `name`. Example shape — adjust the entries to exactly match what copied successfully:

```ts
export interface TechLogo {
  name: string;
  file: string; // basename in public/logos/, rendered as /logos/<file>.svg
}

export const techLogos: TechLogo[] = [
  { name: 'Microsoft', file: 'microsoft' },
  { name: 'Azure', file: 'azure' },
  { name: 'AWS', file: 'aws' },
  { name: 'Google Workspace', file: 'googleworkspace' },
  { name: 'VMware', file: 'vmware' },
  { name: 'Cisco', file: 'cisco' },
  { name: 'Fortinet', file: 'fortinet' },
  { name: 'Ubiquiti', file: 'ubiquiti' },
  { name: 'CrowdStrike', file: 'crowdstrike' },
  { name: 'Proofpoint', file: 'proofpoint' },
  { name: 'Malwarebytes', file: 'malwarebytes' },
  { name: 'Bitdefender', file: 'bitdefender' },
  { name: 'Datto', file: 'datto' },
  { name: 'Veeam', file: 'veeam' },
  { name: 'Synology', file: 'synology' },
  { name: 'TeamViewer', file: 'teamviewer' },
  { name: 'Zoom', file: 'zoom' },
  { name: 'RingCentral', file: 'ringcentral' },
  { name: 'Salesforce', file: 'salesforce' },
  { name: 'Adobe', file: 'adobe' },
  { name: 'Dropbox', file: 'dropbox' },
  { name: 'GitHub', file: 'github' },
  { name: 'OpenAI', file: 'openai' },
  { name: 'Anthropic', file: 'anthropic' },
  { name: 'Supabase', file: 'supabase' },
  { name: 'Python', file: 'python' },
  { name: 'Dell', file: 'dell' },
  { name: 'HP', file: 'hp' },
  { name: 'Lenovo', file: 'lenovo' },
  { name: 'Apple', file: 'apple' },
];
```

> **Critical:** delete any array entry whose SVG printed `MISS` — every entry MUST have a real file in `public/logos/`. If fewer than ~12 brands survived (e.g. many MISS), STOP and report DONE_WITH_CONCERNS with the gap list so the controller can decide on owner-supplied logos before proceeding.

- [ ] **Step 4: Remove the sourcing tool (SVGs are now committed assets)**

```bash
npm uninstall simple-icons
```

- [ ] **Step 5: Verify + commit**

Run: `npm run lint` → clean. `npm run build` → succeeds (assets present; nothing imports the component yet).

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: source curated platform logos + typed tech roster"
```

---

### Task 2: TechMarquee component + i18n + CSS

**Files:**
- Create: `src/components/marketing/TechMarquee.tsx`
- Modify: `src/app/globals.css` (keyframes + marquee/mask/reduced-motion rules)
- Modify: `messages/en.json`, `messages/es.json` (`techMarquee` namespace)
- Test: `src/components/marketing/__tests__/TechMarquee.test.tsx`

**Interfaces:**
- Consumes: `techLogos` / `TechLogo` (Task 1).
- Produces: `TechMarquee({ locale }: { locale: string })` (async server component) and `TechMarqueeView({ label, logos }: { label: string; logos: TechLogo[] })` (sync, exported for testing) — the async wrapper fetches the label and renders the view.

- [ ] **Step 1: Add the `techMarquee` i18n namespace (EN)**

In `messages/en.json`, add a top-level namespace:

```json
"techMarquee": {
  "label": "Platforms we work with"
}
```

- [ ] **Step 2: Add the `techMarquee` i18n namespace (ES)**

In `messages/es.json`, add:

```json
"techMarquee": {
  "label": "Plataformas y herramientas con las que trabajamos"
}
```

- [ ] **Step 3: Write the failing component test**

Create `src/components/marketing/__tests__/TechMarquee.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TechMarqueeView } from '../TechMarquee';

const logos = [
  { name: 'Microsoft', file: 'microsoft' },
  { name: 'Cisco', file: 'cisco' },
];

describe('TechMarqueeView', () => {
  it('renders the label and exactly one accessible logo per roster entry', () => {
    render(<TechMarqueeView label="Platforms we work with" logos={logos} />);
    expect(screen.getByText('Platforms we work with')).toBeTruthy();
    const marks = screen.getAllByRole('img');
    expect(marks).toHaveLength(2); // duplicated loop copy is aria-hidden, not counted
    expect(screen.getByRole('img', { name: 'Microsoft' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Cisco' })).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/components/marketing/__tests__/TechMarquee.test.tsx`
Expected: FAIL — cannot resolve `../TechMarquee`.

- [ ] **Step 5: Implement the component**

Create `src/components/marketing/TechMarquee.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { techLogos, type TechLogo } from '@/lib/tech/logos';

function TechLogoMark({ logo, duplicate = false }: { logo: TechLogo; duplicate?: boolean }) {
  return (
    <span
      role={duplicate ? undefined : 'img'}
      aria-label={duplicate ? undefined : logo.name}
      aria-hidden={duplicate || undefined}
      className="marquee__logo h-8 w-24 shrink-0 bg-ink-muted transition-colors duration-200 hover:bg-ink"
      style={{
        WebkitMaskImage: `url(/logos/${logo.file}.svg)`,
        maskImage: `url(/logos/${logo.file}.svg)`,
      }}
    />
  );
}

export function TechMarqueeView({ label, logos }: { label: string; logos: TechLogo[] }) {
  return (
    <section aria-label={label} className="border-y border-hairline bg-surface-alt py-10">
      <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-ink-muted">{label}</p>
      <div className="marquee group relative overflow-hidden">
        <div className="marquee__track flex w-max items-center gap-12 group-hover:[animation-play-state:paused]">
          {logos.map((l) => <TechLogoMark key={l.file} logo={l} />)}
          {logos.map((l) => <TechLogoMark key={`dup-${l.file}`} logo={l} duplicate />)}
        </div>
      </div>
    </section>
  );
}

export async function TechMarquee({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'techMarquee' });
  return <TechMarqueeView label={t('label')} logos={techLogos} />;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/components/marketing/__tests__/TechMarquee.test.tsx`
Expected: PASS (both marks found; count is 2).

- [ ] **Step 7: Add the marquee CSS to `globals.css`**

Append to `src/app/globals.css`:

```css
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

/* Monochrome masked logos */
.marquee__logo {
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

/* Edge fade so logos ease in/out at the strip edges */
.marquee {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
}

@media (prefers-reduced-motion: no-preference) {
  .marquee__track { animation: marquee-scroll 40s linear infinite; }
}

@media (prefers-reduced-motion: reduce) {
  .marquee__track { flex-wrap: wrap; justify-content: center; }
  .marquee__track > [aria-hidden="true"] { display: none; }
}
```

- [ ] **Step 8: Verify parity, build, lint, commit**

Run i18n parity:
```bash
node -e "const a=require('./messages/en.json'),b=require('./messages/es.json');const k=o=>Object.entries(o).flatMap(([n,v])=>typeof v==='object'&&v?Object.keys(v).map(x=>n+'.'+x):[n]).sort();console.log('equal',JSON.stringify(k(a))===JSON.stringify(k(b)));"
```
Expected: `equal true`.
Run: `npx vitest run` → all pass. `npm run build` → succeeds. `npm run lint` → clean.

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: TechMarquee component (masked monochrome logos, CSS marquee, reduced-motion)"
```

---

### Task 3: Mount on home + e2e + full verification

**Files:**
- Modify: `src/app/[locale]/page.tsx` (insert `<TechMarquee />` after the hero section)
- Test: `e2e/marquee.spec.ts`

**Interfaces:**
- Consumes: `TechMarquee` (Task 2).

- [ ] **Step 1: Mount the marquee on the home page**

In `src/app/[locale]/page.tsx`, add the import:

```tsx
import { TechMarquee } from '@/components/marketing/TechMarquee';
```

Insert `<TechMarquee locale={locale} />` immediately AFTER the closing `</section>` of the hero (the first `<section className="mx-auto max-w-6xl px-6 py-24">…</section>`) and BEFORE `<Announcement … />`. `locale` is already destructured from `params` at the top of the component.

- [ ] **Step 2: Write the e2e**

Create `e2e/marquee.spec.ts` (roster-agnostic — asserts the strip + at least one logo, so it passes regardless of which brands survived Task 1's sourcing):

```ts
import { test, expect } from '@playwright/test';

test('tech marquee renders on the home page with logos', async ({ page }) => {
  await page.goto('/en');
  const strip = page.getByRole('region', { name: /Platforms we work with/i });
  await expect(strip).toBeVisible();
  await expect(strip.getByRole('img').first()).toBeVisible();
});

test('spanish home renders the localized marquee label', async ({ page }) => {
  await page.goto('/es');
  await expect(
    page.getByRole('region', { name: /Plataformas y herramientas con las que trabajamos/i }),
  ).toBeVisible();
});
```

- [ ] **Step 3: Full verification**

Run: `npx vitest run` → all pass. `npm run build` → succeeds; `/[locale]` home still prerenders. `npm run lint` → clean. `npm run e2e -- marquee` → 2 passed. (Ignore any unrelated `socket.io`/`middleware deprecated` webserver log noise; only the test result matters. If port 3000 is occupied by another local project, free it and re-run — do not weaken the test.)

- [ ] **Step 4: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: mount TechMarquee on the home page + e2e"
```

---

## Self-review notes (addressed)

- **Spec coverage:** curated logo sourcing + gap report (Task 1); typed roster data (Task 1); server-component marquee with duplicated seamless track + hover pause + masked monochrome logos + edge fade (Task 2); honest bilingual label via `techMarquee` i18n (Task 2); reduced-motion static grid hiding the aria-hidden duplicate (Task 2 CSS); accessible names on visible logos only (Task 2); placement below the hero (Task 3); testing — unit (label + one accessible mark per roster entry), home e2e EN/ES, build/lint/parity (Tasks 2–3).
- **Async-component testability:** the async `TechMarquee` (which calls `getTranslations`) is NOT unit-tested directly; the sync `TechMarqueeView` carries all the rendering logic and IS unit-tested. This mirrors the repo pattern (only sync presentational components like `InsightCard`/`ServiceCard` are unit-tested).
- **Type consistency:** `TechLogo { name, file }` and `techLogos` defined in Task 1; consumed with matching shape in Task 2's `TechMarqueeView`/`TechMarquee` and the test fixture.
- **No-placeholder-logo rule:** Task 1 Step 3 hard-requires every roster entry to have a real copied file and to drop MISS entries; the e2e (Task 3) is roster-agnostic so it can't be broken by a dropped brand.
- **Sourcing risk (owner-visible):** `simple-icons` has removed several Microsoft marks and may lack niche B2B brands. Task 1 surfaces the exact MISS list; if key brands (Microsoft/Azure) are missing, the controller decides whether to proceed with the reduced set or get owner-supplied SVGs before Task 2. The component renders whatever is in `techLogos`, so adding an owner-supplied SVG later is just a new file + one array entry.
