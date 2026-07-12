# Capabilities Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A bilingual, static `/capabilities` page presenting the founder's full grouped technology inventory + Areas of Expertise, reached from the home marquee and footer.

**Architecture:** A language-neutral data module (`capabilities.ts`) holds deduped product lists per category; the `capabilities` i18n namespace holds the translated headings + expertise phrases + page chrome. A sync `CapabilityChips` component renders each group; the SSG page assembles header + category index + groups + expertise band + CTA. Wiring adds a marquee link, a footer link, and a `knowsAbout` JSON-LD boost.

**Tech Stack:** Next 16 App Router · next-intl v4 · Tailwind v4 · Vitest + Playwright.

## Global Constraints

- Work from repo root `C:\Users\danlo\BIS-Website`. Node 24, npm. Branch: create `feat/capabilities-page` off `main` (do not work on `main`).
- **Content is canonical:** transcribe the group/item lists and expertise phrases from this plan verbatim (they are the spec's Appendix A/B, already de-duplicated). Do not re-derive, pad, or drop items.
- **Bilingual split:** product/platform names are proper nouns — shared, identical in both locales, live in `capabilities.ts`. Category headings, expertise phrases, and page chrome translate — live in the `capabilities` i18n namespace (EN/ES, identical key sets).
- **Dedupe invariant:** no product string appears in two groups (enforced by a unit test).
- **No fabrication:** every item is real owner experience; the "Partnerships" group states real relationships only.
- Reuse `pageMetadata` (`@/lib/seo/metadata`) and `CTASection` (`@/components/ui/CTASection`, props `{ title, body, cta }`). Native Vitest matchers only (no jest-dom).
- Commit after each task with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit`.
- Every task ends green: `npm run lint` clean, `npm run build` succeeds, relevant tests pass.

---

### Task 1: Capabilities data module + i18n namespace + tests

**Files:**
- Create: `src/lib/tech/capabilities.ts`
- Modify: `messages/en.json`, `messages/es.json` (`capabilities` namespace)
- Test: `src/lib/tech/__tests__/capabilities.test.ts`

**Interfaces:**
- Produces: `interface CapabilityGroup { id: string; items: string[] }`; `export const capabilityGroups: CapabilityGroup[]`; `export const expertiseIds: string[]`.

- [ ] **Step 1: Create the data module**

Create `src/lib/tech/capabilities.ts` (verbatim — this is the deduped Appendix A + expertise ids):

```ts
export interface CapabilityGroup {
  id: string; // maps to i18n `capabilities.groups.<id>`
  items: string[]; // proper-noun product names, shared across locales
}

export const capabilityGroups: CapabilityGroup[] = [
  { id: 'infraCloud', items: ['Microsoft 365', 'Microsoft Azure', 'Amazon Web Services (AWS)', 'Google Workspace', 'Exchange Online', 'Windows Server', 'Remote Desktop Services (RDS)', 'Azure Portal'] },
  { id: 'virtualization', items: ['VMware', 'Hyper-V'] },
  { id: 'networking', items: ['Cisco', 'Cisco Meraki', 'Fortinet (FortiGate)', 'Ubiquiti UniFi', 'SonicWall', 'Aruba Networks', 'HPE Networking', 'Dell Networking', 'TP-Link Business', 'Netgear Business', 'Synology Routers', 'DNS', 'DHCP', 'DFS'] },
  { id: 'security', items: ['CrowdStrike Falcon', 'Microsoft Defender', 'Microsoft Defender for Endpoint', 'Microsoft Defender for Office 365', 'Microsoft Sentinel', 'Bitdefender', 'Malwarebytes', 'Huntress', 'Proofpoint', 'Barracuda', 'DNSFilter', 'Breach Secure Now'] },
  { id: 'backupDr', items: ['Datto', 'Axcient', 'Veeam', 'Azure Backup', 'Windows Server Backup'] },
  { id: 'storage', items: ['Synology', 'QNAP', 'Dell PowerVault'] },
  { id: 'endpoint', items: ['Microsoft Intune', 'Microsoft Endpoint Manager', 'Windows Autopilot', 'Group Policy'] },
  { id: 'remote', items: ['TeamViewer', 'AnyDesk', 'ConnectWise Control (ScreenConnect)', 'Quick Assist'] },
  { id: 'voip', items: ['Microsoft Teams Phone', 'Talkdesk', 'RingCentral', 'Zoom', 'Cisco Webex'] },
  { id: 'identity', items: ['Microsoft Entra ID (Azure AD)', 'Active Directory', 'Cisco Duo', 'Keeper Security', 'Single Sign-On (SSO)', 'Multi-Factor Authentication (MFA)'] },
  { id: 'productivity', items: ['Microsoft Office', 'Microsoft Teams', 'SharePoint', 'OneDrive', 'OneNote', 'Microsoft Planner', 'Microsoft Loop', 'Trello', 'Asana', 'Monday.com', 'Dropbox', 'Box', 'Adobe Acrobat Pro', 'Adobe Creative Cloud'] },
  { id: 'crm', items: ['Salesforce', 'HubSpot', 'Microsoft Dynamics'] },
  { id: 'legal', items: ['Litify', 'Needles Neos', 'Docrio', 'Trainual'] },
  { id: 'bi', items: ['Microsoft Power BI', 'Microsoft Excel', 'Azure Data Warehouse'] },
  { id: 'databases', items: ['Microsoft SQL Server', 'Azure SQL', 'MySQL', 'PostgreSQL', 'Supabase'] },
  { id: 'devAi', items: ['OpenAI API', 'Anthropic Claude API', 'OpenRouter', 'GLM 5.2', 'GitHub', 'GitHub Copilot', 'Visual Studio Code', 'Cursor', 'Claude Code CLI', 'Clerk', 'REST APIs', 'Python', 'PowerShell', 'JavaScript', 'TypeScript', 'HTML & CSS'] },
  { id: 'monitoring', items: ['Windows Event Viewer', 'Performance Monitor', 'Microsoft 365 Admin Center', 'CrowdStrike Console', 'FortiManager', 'UniFi Controller'] },
  { id: 'hardware', items: ['Dell', 'HP', 'Lenovo', 'Microsoft Surface', 'Apple', 'APC', 'Eaton', 'EcoFlow'] },
  { id: 'partners', items: ['Applied Technology (Managed Service Provider)', 'Microsoft Partner Ecosystem', 'Hardware VARs & Procurement Partners'] },
];

export const expertiseIds: string[] = [
  'm365admin', 'azure', 'iam', 'endpointMgmt', 'networkDesign', 'firewall', 'wireless',
  'cybersecurity', 'backupDr', 'bcp', 'itOps', 'itPm', 'vendorMgmt', 'licensing', 'legalTech',
  'contactCenter', 'dataAnalytics', 'aiIntegration', 'automation', 'powerbi', 'itStrategy',
  'modernization', 'digitalTransformation', 'assessments', 'helpdesk', 'sysadmin',
];
```

- [ ] **Step 2: Add the `capabilities` namespace (EN)**

In `messages/en.json`, add a top-level `capabilities` namespace:

```json
"capabilities": {
  "title": "Capabilities",
  "intro": "The platforms, tools, and disciplines behind BIS — two decades of hands-on IT and AI experience, put to work for Rio Grande Valley businesses.",
  "metaDescription": "The full stack of platforms, tools, and disciplines BIS works across — cloud, security, networking, backup, AI, and more — for Rio Grande Valley businesses.",
  "indexLabel": "Jump to",
  "expertiseHeading": "Areas of Expertise",
  "viewAll": "View our full technology stack",
  "ctaTitle": "Need this expertise on your side?",
  "ctaBody": "Start with a free, no-pitch assessment — we'll map the right tools to your goals.",
  "groups": {
    "infraCloud": "Infrastructure & Cloud",
    "virtualization": "Virtualization",
    "networking": "Networking",
    "security": "Cybersecurity",
    "backupDr": "Backup & Disaster Recovery",
    "storage": "Storage",
    "endpoint": "Endpoint Management",
    "remote": "Remote Support",
    "voip": "VoIP & Unified Communications",
    "identity": "Identity & Access",
    "productivity": "Productivity & Collaboration",
    "crm": "CRM & Business Applications",
    "legal": "Legal Technology",
    "bi": "Business Intelligence & Reporting",
    "databases": "Databases",
    "devAi": "Development & AI",
    "monitoring": "Monitoring & Management",
    "hardware": "Hardware",
    "partners": "Partnerships"
  },
  "expertise": {
    "m365admin": "Microsoft 365 Administration",
    "azure": "Azure Cloud Services",
    "iam": "Identity & Access Management",
    "endpointMgmt": "Endpoint Management",
    "networkDesign": "Network Design",
    "firewall": "Firewall Administration",
    "wireless": "Wireless Infrastructure",
    "cybersecurity": "Cybersecurity",
    "backupDr": "Backup & Disaster Recovery",
    "bcp": "Business Continuity Planning",
    "itOps": "IT Operations",
    "itPm": "IT Project Management",
    "vendorMgmt": "Vendor Management",
    "licensing": "Microsoft Licensing",
    "legalTech": "Legal Technology",
    "contactCenter": "Contact Center Technology",
    "dataAnalytics": "Data Analytics",
    "aiIntegration": "AI Integration",
    "automation": "Process Automation",
    "powerbi": "Power BI Dashboard Development",
    "itStrategy": "IT Strategy",
    "modernization": "Infrastructure Modernization",
    "digitalTransformation": "Digital Transformation",
    "assessments": "Technology Assessments",
    "helpdesk": "Help Desk Management",
    "sysadmin": "Systems Administration"
  }
}
```

- [ ] **Step 3: Add the `capabilities` namespace (ES)**

In `messages/es.json`, add (identical keys):

```json
"capabilities": {
  "title": "Capacidades",
  "intro": "Las plataformas, herramientas y disciplinas detrás de BIS — dos décadas de experiencia práctica en IT e IA, al servicio de los negocios del Valle del Río Grande.",
  "metaDescription": "El stack completo de plataformas, herramientas y disciplinas con las que trabaja BIS — nube, seguridad, redes, respaldo, IA y más — para los negocios del Valle del Río Grande.",
  "indexLabel": "Ir a",
  "expertiseHeading": "Áreas de Especialización",
  "viewAll": "Ver nuestro stack tecnológico completo",
  "ctaTitle": "¿Necesitas esta experiencia de tu lado?",
  "ctaBody": "Empieza con una evaluación gratuita y sin presión de venta — alineamos las herramientas correctas con tus objetivos.",
  "groups": {
    "infraCloud": "Infraestructura y Nube",
    "virtualization": "Virtualización",
    "networking": "Redes",
    "security": "Ciberseguridad",
    "backupDr": "Respaldo y Recuperación ante Desastres",
    "storage": "Almacenamiento",
    "endpoint": "Gestión de Dispositivos",
    "remote": "Soporte Remoto",
    "voip": "VoIP y Comunicaciones Unificadas",
    "identity": "Identidad y Acceso",
    "productivity": "Productividad y Colaboración",
    "crm": "CRM y Aplicaciones de Negocio",
    "legal": "Tecnología Legal",
    "bi": "Inteligencia de Negocio y Reportes",
    "databases": "Bases de Datos",
    "devAi": "Desarrollo e IA",
    "monitoring": "Monitoreo y Administración",
    "hardware": "Hardware",
    "partners": "Alianzas"
  },
  "expertise": {
    "m365admin": "Administración de Microsoft 365",
    "azure": "Servicios en la Nube de Azure",
    "iam": "Gestión de Identidad y Acceso",
    "endpointMgmt": "Gestión de Dispositivos",
    "networkDesign": "Diseño de Redes",
    "firewall": "Administración de Firewalls",
    "wireless": "Infraestructura Inalámbrica",
    "cybersecurity": "Ciberseguridad",
    "backupDr": "Respaldo y Recuperación ante Desastres",
    "bcp": "Planificación de Continuidad del Negocio",
    "itOps": "Operaciones de IT",
    "itPm": "Gestión de Proyectos de IT",
    "vendorMgmt": "Gestión de Proveedores",
    "licensing": "Licenciamiento de Microsoft",
    "legalTech": "Tecnología Legal",
    "contactCenter": "Tecnología de Centros de Contacto",
    "dataAnalytics": "Análisis de Datos",
    "aiIntegration": "Integración de IA",
    "automation": "Automatización de Procesos",
    "powerbi": "Desarrollo de Dashboards en Power BI",
    "itStrategy": "Estrategia de IT",
    "modernization": "Modernización de Infraestructura",
    "digitalTransformation": "Transformación Digital",
    "assessments": "Evaluaciones Tecnológicas",
    "helpdesk": "Gestión de Mesa de Ayuda",
    "sysadmin": "Administración de Sistemas"
  }
}
```

- [ ] **Step 4: Write the failing data tests**

Create `src/lib/tech/__tests__/capabilities.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { capabilityGroups, expertiseIds } from '../capabilities';

const read = (f: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const en = read('en.json');
const es = read('es.json');

describe('capabilities data', () => {
  it('lists every product exactly once across all groups', () => {
    const all = capabilityGroups.flatMap((g) => g.items);
    const counts = new Map<string, number>();
    for (const x of all) counts.set(x, (counts.get(x) ?? 0) + 1);
    const dups = [...counts].filter(([, n]) => n > 1).map(([x]) => x);
    expect(dups).toEqual([]);
  });

  it('has an EN and ES heading for every group id', () => {
    for (const g of capabilityGroups) {
      expect(en.capabilities.groups[g.id], `en heading ${g.id}`).toBeTruthy();
      expect(es.capabilities.groups[g.id], `es heading ${g.id}`).toBeTruthy();
    }
  });

  it('has an EN and ES phrase for every expertise id', () => {
    for (const id of expertiseIds) {
      expect(en.capabilities.expertise[id], `en expertise ${id}`).toBeTruthy();
      expect(es.capabilities.expertise[id], `es expertise ${id}`).toBeTruthy();
    }
  });
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/tech` → 3 pass (data + both message files already written in Steps 1–3).
Run i18n parity:
```bash
node -e "const a=require('./messages/en.json'),b=require('./messages/es.json');const k=o=>Object.entries(o).flatMap(([n,v])=>typeof v==='object'&&v?Object.keys(v).flatMap(x=>typeof v[x]==='object'&&v[x]?Object.keys(v[x]).map(y=>n+'.'+x+'.'+y):[n+'.'+x]):[n]).sort();console.log('equal',JSON.stringify(k(a))===JSON.stringify(k(b)));"
```
Expected: `equal true`. (This flattener descends two levels so it covers `capabilities.groups.*` and `capabilities.expertise.*`.)

- [ ] **Step 6: Verify build + lint + commit**

Run: `npm run build` → succeeds. `npm run lint` → clean.

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: capabilities data module + bilingual capabilities i18n + dedupe/coverage tests"
```

---

### Task 2: CapabilityChips component

**Files:**
- Create: `src/components/marketing/CapabilityChips.tsx`
- Test: `src/components/marketing/__tests__/CapabilityChips.test.tsx`

**Interfaces:**
- Produces: `CapabilityChips({ id, heading, items, emphatic }: { id?: string; heading: string; items: string[]; emphatic?: boolean })` — an accessible section with an `<h2>` heading and a `<ul>` of chip `<li>`s.

- [ ] **Step 1: Write the failing test**

Create `src/components/marketing/__tests__/CapabilityChips.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapabilityChips } from '../CapabilityChips';

describe('CapabilityChips', () => {
  it('renders the heading and one chip per item', () => {
    render(<CapabilityChips heading="Networking" items={['Cisco', 'Fortinet', 'Ubiquiti']} />);
    expect(screen.getByRole('heading', { name: 'Networking' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Fortinet')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/marketing/__tests__/CapabilityChips.test.tsx`
Expected: FAIL — cannot resolve `../CapabilityChips`.

- [ ] **Step 3: Implement the component**

Create `src/components/marketing/CapabilityChips.tsx`:

```tsx
export function CapabilityChips({
  id, heading, items, emphatic = false,
}: { id?: string; heading: string; items: string[]; emphatic?: boolean }) {
  const headingId = id ? `${id}-h` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className="mt-10 scroll-mt-24">
      <h2 id={headingId} className="text-lg font-bold text-ink">{heading}</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className={
              emphatic
                ? 'rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-ink'
                : 'rounded-full border border-hairline bg-surface-alt px-3 py-1.5 text-sm text-ink-muted'
            }
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/marketing/__tests__/CapabilityChips.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + lint + commit**

Run: `npm run build` → succeeds. `npm run lint` → clean.

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: CapabilityChips component (accessible chip group)"
```

---

### Task 3: /capabilities page route

**Files:**
- Create: `src/app/[locale]/capabilities/page.tsx`

**Interfaces:**
- Consumes: `capabilityGroups`, `expertiseIds` (Task 1); `CapabilityChips` (Task 2); `pageMetadata`; `CTASection` (props `{ title, body, cta }`).

- [ ] **Step 1: Create the page**

Create `src/app/[locale]/capabilities/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CapabilityChips } from '@/components/marketing/CapabilityChips';
import { CTASection } from '@/components/ui/CTASection';
import { pageMetadata } from '@/lib/seo/metadata';
import { capabilityGroups, expertiseIds } from '@/lib/tech/capabilities';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'capabilities' });
  return pageMetadata({ locale, path: '/capabilities', title: t('title'), description: t('metaDescription') });
}

export default async function CapabilitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'capabilities' });
  const c = await getTranslations('common');

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-extrabold text-ink">{t('title')}</h1>
      <p className="mt-3 max-w-3xl text-ink-muted">{t('intro')}</p>

      <nav aria-label={t('indexLabel')} className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-y border-hairline py-4 text-sm">
        {capabilityGroups.map((g) => (
          <a key={g.id} href={`#${g.id}`} className="text-ink-muted hover:text-primary">{t(`groups.${g.id}`)}</a>
        ))}
      </nav>

      {capabilityGroups.map((g) => (
        <CapabilityChips key={g.id} id={g.id} heading={t(`groups.${g.id}`)} items={g.items} />
      ))}

      <CapabilityChips
        heading={t('expertiseHeading')}
        items={expertiseIds.map((id) => t(`expertise.${id}`))}
        emphatic
      />

      <div className="mt-16">
        <CTASection title={t('ctaTitle')} body={t('ctaBody')} cta={c('cta')} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build` → succeeds; output lists `/[locale]/capabilities` prerendered in EN + ES. `npm run lint` → clean.

- [ ] **Step 3: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: /capabilities page (grouped bilingual tech inventory + expertise + index)"
```

---

### Task 4: Wiring (marquee link + footer link + knowsAbout) + e2e + full verification

**Files:**
- Modify: `src/components/marketing/TechMarquee.tsx` (add "view all" link)
- Modify: `messages/en.json`, `messages/es.json` (`techMarquee.viewAll`, footer `capabilities`; drop footer `caseStudies`)
- Modify: `src/components/layout/Footer.tsx` (Capabilities link)
- Modify: `src/components/seo/StructuredData.tsx` (`knowsAbout`)
- Test: `e2e/capabilities.spec.ts`

**Interfaces:**
- Consumes: `capabilityGroups` (Task 1); the `/capabilities` route (Task 3).

- [ ] **Step 1: Add the marquee "view all" i18n key (EN + ES)**

In `messages/en.json` `techMarquee`, add `"viewAll": "View our full technology stack"`.
In `messages/es.json` `techMarquee`, add `"viewAll": "Ver nuestro stack tecnológico completo"`.
(So `techMarquee` becomes `{ "label": ..., "viewAll": ... }` in both.)

- [ ] **Step 2: Add the link to the marquee**

In `src/components/marketing/TechMarquee.tsx`:
- add `import { Link } from '@/i18n/navigation';` at the top;
- extend `TechMarqueeView`'s props to `{ label, logos, viewAllHref, viewAllLabel }` (the two new ones optional: `viewAllHref?: string; viewAllLabel?: string`), and after the `<div className="marquee …">…</div>` block but before `</section>`, render:

```tsx
      {viewAllHref && viewAllLabel && (
        <div className="mt-6 text-center">
          <Link href={viewAllHref} className="text-sm font-semibold text-primary hover:underline">
            {viewAllLabel} →
          </Link>
        </div>
      )}
```

- in the async `TechMarquee`, pass them through:

```tsx
  return <TechMarqueeView label={t('label')} logos={techLogos} viewAllHref="/capabilities" viewAllLabel={t('viewAll')} />;
```

(The existing `TechMarquee.test.tsx` passes no `viewAll*` props, so the link is absent there — the test still asserts exactly 2 logo marks and passes unchanged.)

- [ ] **Step 3: Wire the footer link**

In `messages/en.json` `footer`, add `"capabilities": "Capabilities"` and REMOVE `"caseStudies"`. In `messages/es.json` `footer`, add `"capabilities": "Capacidades"` and REMOVE `"caseStudies"`.

In `src/components/layout/Footer.tsx`, change the Company-column line
`<li>{t('methodology')}</li><li>{t('caseStudies')}</li>`
to
`<li>{t('methodology')}</li><li><Link href="/capabilities">{t('capabilities')}</Link></li>`
(`Link` from `@/i18n/navigation` is already imported in Footer.tsx.)

- [ ] **Step 4: Add `knowsAbout` to the JSON-LD**

In `src/components/seo/StructuredData.tsx`, add `import { capabilityGroups } from '@/lib/tech/capabilities';` and add this line inside the `data` object (e.g. after `availableLanguage`):

```tsx
    knowsAbout: capabilityGroups.flatMap((g) => g.items),
```

- [ ] **Step 5: Write the e2e**

Create `e2e/capabilities.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('capabilities reachable from the marquee link and lists tech', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('link', { name: /full technology stack/i }).click();
  await expect(page).toHaveURL(/\/en\/capabilities/);
  await expect(page.getByRole('heading', { level: 1, name: /Capabilities/i })).toBeVisible();
  await expect(page.getByText('Litify')).toBeVisible();
});

test('spanish capabilities renders the localized title', async ({ page }) => {
  await page.goto('/es/capabilities');
  await expect(page.getByRole('heading', { level: 1, name: /Capacidades/i })).toBeVisible();
});
```

- [ ] **Step 6: Full verification**

Run i18n parity (two-level flattener from Task 1 Step 5) → `equal true`.
Run: `npx vitest run` → all pass (capabilities data 3, CapabilityChips 1, everything else; the pre-existing `resend.test.ts` full-suite flake is unrelated — confirm it passes in isolation with `npx vitest run src/lib/email` if it appears).
Run: `npm run build` → succeeds, `/[locale]/capabilities` prerendered EN + ES. `npm run lint` → clean.
Run: `npm run e2e -- capabilities` → 2 passed. (If port 3000 is held by another local project, free it and re-run — do not weaken the test.)

- [ ] **Step 7: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: wire /capabilities from marquee + footer, knowsAbout JSON-LD, e2e"
```

---

## Self-review notes (addressed)

- **Spec coverage:** deduped grouped data + expertise ids (Task 1, Appendix A/B transcribed); bilingual split with parity + coverage tests (Task 1); `CapabilityChips` (Task 2); SSG page with header + category index + groups + expertise band + CTA + `pageMetadata` SEO (Task 3); marquee link + footer link + `knowsAbout` JSON-LD + e2e (Task 4). Comprehensive-cleaned, reached via marquee+footer not nav, `/capabilities` route — all honored.
- **Dedupe invariant** is a real test (Task 1) over the actual `capabilityGroups`; `Synology` (storage) vs `Synology Routers` (networking) and `Azure Portal` (infraCloud only) were the two dedupe risks and are resolved in the data.
- **i18n coverage** test ties every group `id` and every `expertiseId` to EN+ES keys, so a missing translation fails the suite; the two-level parity flattener covers the nested `groups`/`expertise` objects.
- **Type consistency:** `CapabilityGroup { id, items }`, `capabilityGroups`, `expertiseIds` defined in Task 1 and consumed identically in Tasks 3–4; `CapabilityChips` prop shape defined in Task 2 and used in Task 3; `CTASection` props `{ title, body, cta }` match the home-page usage.
- **No async-component unit test:** the page is an async server component (not unit-tested, per repo pattern); its pieces (`CapabilityChips`, the data) are unit-tested, and rendering is verified by build + e2e.
- **Marquee test unaffected:** new `viewAll*` props are optional and omitted by the existing test.
