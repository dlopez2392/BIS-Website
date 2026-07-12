# Capabilities Page (`/capabilities`) — Design Spec

**Date:** 2026-07-11
**Status:** Approved — ready for implementation plan
**Scope:** A single bilingual, static `/capabilities` page presenting the founder's full technology/platform inventory (grouped, de-duplicated) plus an Areas of Expertise band. Reached from a link under the home marquee and from the footer. This is "piece B" of the platforms decomposition (piece A = the home tech marquee, already shipped).

## Goal

Give the deep, honest, SEO-friendly proof behind the home marquee: every platform, tool, and discipline the founder has hands-on experience with — the non-logo long tail (DNS, PowerShell, Group Policy, etc.) and the Areas of Expertise that don't belong in a logo strip.

## Decisions (locked during brainstorming)

1. **Comprehensive, cleaned:** include essentially everything from the owner's list, **de-duplicated** (each item appears in exactly one category), lightly tidied; ultra-generic standalone items (JSON, HTML, CSS) folded into a sensible group; depth items (DNS, DHCP, Group Policy) kept — they demonstrate real IT depth.
2. **Reached via marquee link + footer**, NOT a 7th nav item (nav already has 6). A "View our full technology stack →" link under the home marquee, and a real footer link (replacing the dead "Case Studies" text in the Company column).
3. **Route:** `/capabilities`, title EN "Capabilities" / ES "Capacidades".
4. **Bilingual split:** product/platform names are proper nouns — language-neutral, shown identically in both locales. Everything that genuinely translates (page title/intro, category headings, the "Areas of Expertise" heading, and the expertise phrases) lives in i18n (EN/ES, parity-checked).
5. **No fabrication:** every item is something the owner listed as real experience. No invented certifications/partnerships. The "Partnerships" group states real relationships only.

## Non-Goals (YAGNI)

- No search/filter, no per-item logos or links, no CMS, no pagination — it's a static grouped list.
- No nav item. No case studies (that's the separate future `/work` phase).
- No new design primitives beyond a simple chip and section — reuse existing tokens.

## Architecture

### Data model — `src/lib/tech/capabilities.ts` (language-neutral)

```ts
export interface CapabilityGroup {
  id: string;        // maps to i18n heading key `capabilities.groups.<id>`
  items: string[];   // proper-noun product/tool names, shown as-is in both locales
}
export const capabilityGroups: CapabilityGroup[]; // ordered, deduped (Appendix A)

// Areas of Expertise are phrases that translate, so they are NOT here —
// they live as i18n keys (Appendix B), referenced by a stable id list:
export const expertiseIds: string[]; // e.g. ['m365admin', 'azure', ...] -> capabilities.expertise.<id>
```

Invariant: **no product string appears in two groups** (enforced by a unit test).

### i18n — `capabilities` namespace (EN/ES, identical keys, parity-checked)

```
capabilities: {
  title, intro, indexLabel, expertiseHeading, ctaTitle, ctaBody,
  groups:   { infraCloud: "...", virtualization: "...", ... },   // one per CapabilityGroup.id
  expertise:{ m365admin: "...", azure: "...", ... }              // one per expertiseIds entry
}
```

Category headings + expertise phrases are the only translated content; the product lists are shared.

### Component structure

- **`src/app/[locale]/capabilities/page.tsx`** (server component, SSG):
  - `generateMetadata` via `pageMetadata({ locale, path: '/capabilities', title, description })` (canonical + hreflang + OG, reused).
  - Renders: header (title + intro); a **category index** (anchor links to each group, using `id` as the anchor); each group as a heading + a `CapabilityChips` wrap; the **Areas of Expertise** section (distinct styling); a closing `CTASection`.
- **`src/components/marketing/CapabilityChips.tsx`** (sync, testable): given a heading + `string[]`, renders an accessible section with a `<ul>` of chip `<li>`s. Reused for both product groups and (with a bolder variant) the expertise band. Props: `{ id?: string; heading: string; items: string[]; emphatic?: boolean }`.

### Wiring existing UI

- **Home marquee** (`src/components/marketing/TechMarquee.tsx`): add a centered "View our full technology stack →" link (localized, `capabilities.viewAll`) below the strip → `/capabilities`. (Adds one i18n key to the `techMarquee` namespace or `capabilities`; place under `capabilities.viewAll`.)
- **Footer** (`src/components/layout/Footer.tsx`): make the Company column's dead `caseStudies`/`methodology` text into a real **Capabilities** link → `/capabilities` (repurpose the `methodology` slot to a `capabilities` footer key, or add one; keep parity).
- **SEO:** extend the `ProfessionalService` JSON-LD (`src/lib/seo/business.ts` / `StructuredData`) with a `knowsAbout` array built from the capability items — genuinely improves "IT consultant who does X" discoverability. Keep it to the product/skill names.

## Testing

- **Unit (`src/lib/tech/__tests__/capabilities.test.ts`):** no product string appears in more than one group (dedupe invariant); every `CapabilityGroup.id` has a matching `capabilities.groups.<id>` key in EN and ES; every `expertiseIds` entry has a `capabilities.expertise.<id>` key in EN and ES.
- **Component (`CapabilityChips.test.tsx`):** renders the heading and one `listitem` per item (native Vitest matchers, no jest-dom).
- **Build/lint/parity:** `npm run build` prerenders `/[locale]/capabilities` in EN+ES; `npm run lint` clean; i18n parity `equal true`.
- **e2e (`e2e/capabilities.spec.ts`):** the home marquee's "full technology stack" link navigates to `/en/capabilities`; the page shows the title and ≥1 chip; `/es/capabilities` renders the localized title.

## Success criteria

1. `/en/capabilities` and `/es/capabilities` render the full grouped inventory + Areas of Expertise, product names shared and headings/expertise localized.
2. Every item appears exactly once; the dedupe + i18n-coverage tests pass.
3. Reachable from the home marquee link and the footer; not in the top nav.
4. `knowsAbout` JSON-LD present; per-page SEO (title/description/canonical/hreflang/OG) correct.
5. Lint clean, unit + e2e green, build succeeds, i18n parity holds. Deploy = push to `main`.

## Risks / notes for the implementer

- **AGENTS.md:** modified Next 16 — static server component, low risk; follow the existing page pattern (`industries/page.tsx`).
- The canonical, de-duplicated content is **Appendix A/B below** — transcribe it into `capabilities.ts` + the i18n namespaces; do not re-derive or pad it.
- Long page: include the category index (anchor links) so it stays navigable.
- Repo conventions: native Vitest matchers only; commit with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com"`.

---

## Appendix A — Capability groups (de-duplicated; each item appears once)

- **infraCloud** — "Infrastructure & Cloud": Microsoft 365, Microsoft Azure, Amazon Web Services (AWS), Google Workspace, Exchange Online, Windows Server, Remote Desktop Services (RDS), Azure Portal
- **virtualization** — "Virtualization": VMware, Hyper-V
- **networking** — "Networking": Cisco, Cisco Meraki, Fortinet (FortiGate), Ubiquiti UniFi, SonicWall, Aruba Networks, HPE Networking, Dell Networking, TP-Link Business, Netgear Business, Synology Routers, DNS, DHCP, DFS
- **security** — "Cybersecurity": CrowdStrike Falcon, Microsoft Defender, Microsoft Defender for Endpoint, Microsoft Defender for Office 365, Microsoft Sentinel, Bitdefender, Malwarebytes, Huntress, Proofpoint, Barracuda, DNSFilter, Breach Secure Now
- **backupDr** — "Backup & Disaster Recovery": Datto, Axcient, Veeam, Azure Backup, Windows Server Backup
- **storage** — "Storage": Synology, QNAP, Dell PowerVault
- **endpoint** — "Endpoint Management": Microsoft Intune, Microsoft Endpoint Manager, Windows Autopilot, Group Policy
- **remote** — "Remote Support": TeamViewer, AnyDesk, ConnectWise Control (ScreenConnect), Quick Assist
- **voip** — "VoIP & Unified Communications": Microsoft Teams Phone, Talkdesk, RingCentral, Zoom, Cisco Webex
- **identity** — "Identity & Access": Microsoft Entra ID (Azure AD), Active Directory, Cisco Duo, Keeper Security, Single Sign-On (SSO), Multi-Factor Authentication (MFA)
- **productivity** — "Productivity & Collaboration": Microsoft Office, Microsoft Teams, SharePoint, OneDrive, OneNote, Microsoft Planner, Microsoft Loop, Trello, Asana, Monday.com, Dropbox, Box, Adobe Acrobat Pro, Adobe Creative Cloud
- **crm** — "CRM & Business Applications": Salesforce, HubSpot, Microsoft Dynamics
- **legal** — "Legal Technology": Litify, Needles Neos, Docrio, Trainual
- **bi** — "Business Intelligence & Reporting": Microsoft Power BI, Microsoft Excel, Azure Data Warehouse
- **databases** — "Databases": Microsoft SQL Server, Azure SQL, MySQL, PostgreSQL, Supabase
- **devAi** — "Development & AI": OpenAI API, Anthropic Claude API, OpenRouter, GLM 5.2, GitHub, GitHub Copilot, Visual Studio Code, Cursor, Claude Code CLI, Clerk, REST APIs, Python, PowerShell, JavaScript, TypeScript, HTML & CSS
- **monitoring** — "Monitoring & Management": Windows Event Viewer, Performance Monitor, Microsoft 365 Admin Center, CrowdStrike Console, FortiManager, UniFi Controller
- **hardware** — "Hardware": Dell, HP, Lenovo, Microsoft Surface, Apple, APC, Eaton, EcoFlow
- **partners** — "Partnerships": Applied Technology (Managed Service Provider), Microsoft Partner Ecosystem, Hardware VARs & procurement partners

> Dedupe already applied: `Synology` lives only under **storage** (its routers are the separate "Synology Routers" under networking); `Azure Portal` lives only under **infraCloud**. The dedupe unit test enforces exact-string uniqueness across all groups.

## Appendix B — Areas of Expertise (translated phrases; `expertiseIds` → EN)

m365admin "Microsoft 365 Administration" · azure "Azure Cloud Services" · iam "Identity & Access Management" · endpointMgmt "Endpoint Management" · networkDesign "Network Design" · firewall "Firewall Administration" · wireless "Wireless Infrastructure" · cybersecurity "Cybersecurity" · backupDr "Backup & Disaster Recovery" · bcp "Business Continuity Planning" · itOps "IT Operations" · itPm "IT Project Management" · vendorMgmt "Vendor Management" · licensing "Microsoft Licensing" · legalTech "Legal Technology" · contactCenter "Contact Center Technology" · dataAnalytics "Data Analytics" · aiIntegration "AI Integration" · automation "Process Automation" · powerbi "Power BI Dashboard Development" · itStrategy "IT Strategy" · modernization "Infrastructure Modernization" · digitalTransformation "Digital Transformation" · assessments "Technology Assessments" · helpdesk "Help Desk Management" · sysadmin "Systems Administration"

(ES translations for Appendix B + all `groups.*` headings are authored during implementation and owner-reviewed, per the standing ES-copy caveat.)
