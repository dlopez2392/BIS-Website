# Bespoke Intelligent Solutions — Website Design Spec

**Date:** 2026-07-05
**Status:** Approved (pending spec review)
**Repo:** https://github.com/dlopez2392/BIS-Website
**Source of truth for design/copy:** Google Stitch project `15654845431234053402` ("Bespoke Intelligent Solutions Site") — 5 pages, light + dark, EN/ES, pulled via the Stitch MCP server.

---

## 1. Overview

Marketing + lead-generation website for **Bespoke Intelligent Solutions (BIS)**, an IT/AI consulting firm founded by **Dan Lopez**, based in **Harlingen, TX**, serving the **Rio Grande Valley (RGV)**.

**Brand:** styled `bis>` (terminal-prompt aesthetic). Positioning: "Let us **B**e your **I**ntelligent **S**olution" / "Built for the Valley." Bilingual (English/Spanish) is a **core brand pillar**, not an afterthought.

**Primary goal:** generate qualified leads via a "Free Assessment" flow, while establishing credibility for a new firm.

**Service pillars (3):** AI & Automation · IT Consulting & Security · Website Design
**Industries (5):** Legal · Medical & Dental · Logistics & Freight · Skilled Trades · Agriculture

---

## 2. Decisions (locked)

| Decision | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript on Vercel |
| Languages | **Full EN + ES at launch** |
| Contact backend | **Owned endpoint** (Server Action) + Resend + Neon lead storage; automation-ready |
| Domain | **TBD** — build with placeholders + Resend test sender; wire real domain before launch |
| Blog + Case Studies | **Both in v1** (MDX, bilingual) |
| Copy treatment | Use Stitch copy **as-is, but soften/fix risky claims** (unverifiable stats, email + date inconsistencies) |
| Spanish copy | **Drafted by Claude from the English** for Dan's review (native-quality, not machine-literal) |
| Dark mode | Keep light/dark toggle (both already designed in Stitch) |

---

## 3. Stack

- **Next.js (App Router) + TypeScript**, deployed on **Vercel**
- **Tailwind CSS** — port Stitch's exact theme: primary `#2745e0`, metallic-gold `#C9A227`, plus the full named-color palette and light/dark tokens. **Hanken Grotesk** via `next/font/google`.
- **next-intl** — locale routing (`/[locale]`) + message catalogs
- **next-themes** — class-based light/dark toggle (matches Stitch `darkMode: "class"`)
- **MDX** (Content Collections) — blog + case studies
- **Resend + React Email** — transactional email (notification + bilingual thank-you)
- **Neon Postgres + Drizzle ORM** — lead storage (provisioned via Vercel Marketplace)
- **lucide-react** — icons (faithful swaps for the Material Symbols used in the draft)
- **zod** + **react-hook-form** — form validation

---

## 4. Routing (locale-prefixed)

```
/[locale]                    Home
/[locale]/services           Services       ("What we do")
/[locale]/industries         Industries     ("Built for the Valley")
/[locale]/about              About          ("Who we are")
/[locale]/contact            Contact        ("Free Assessment" form)
/[locale]/insights           Blog index     ("What we think")
/[locale]/insights/[slug]    Blog post
/[locale]/work               Case studies index
/[locale]/work/[slug]        Case study
```

- `locale ∈ {en, es}`, default `en`.
- Middleware handles locale detection/routing; header exposes an EN|ES toggle that preserves the current path.

---

## 5. Bilingual content model

- **UI strings + page marketing copy** → structured next-intl message files: `messages/en.json`, `messages/es.json`, one namespace per page/section.
- **Spanish** is drafted from the approved English by Claude — native, idiomatic RGV Spanish (not literal), presented to Dan for approval before it ships.
- **Blog / case studies** → MDX with a `locale` dimension so each entry exists in both languages; untranslated entries fall back gracefully.

---

## 6. Contact automation (the future-proof hub)

Form submit → **Server Action**:

1. **Validate** input (zod) — fields: Full Name, Business Name, Email, Phone, Industry, Preferred Language, Message (optional).
2. **Store lead** in Neon (`leads` table) — nothing is ever lost.
3. **Notify Dan** — email (and later Slack) "new assessment request."
4. **Auto thank-you to prospect** — bilingual (EN or ES per their toggle) via Resend + React Email.

Designed so these drop in later **without rework**:
- **Vercel Workflow** — durable drip/follow-up sequences (e.g., thank-you now → wait 2 days → nudge if no reply).
- **CRM sync / calendar booking / AI lead-scoring** — additional steps on the same handler.

Dev works before a domain exists via Resend's test sender (`onboarding@resend.dev`); swap to `hello@<domain>` once DNS is verified.

---

## 7. Design-system port

Rebuild each page as clean, composable React components that match the Stitch **layouts/screenshots** — not pasted machine-generated HTML. Shared components:

`Header` (logo `bis>`, nav, EN|ES toggle, theme toggle) · `Footer` · `ServiceCard` · `IndustryCard` · `StatBand` · `Quote` · `SectionHeading` · `CTASection` · `PostCard` · `CaseCard` · `ContactForm`.

Preserve the `bis>` terminal-prompt branding and the "Let us **B**e your **I**ntelligent **S**olution" letter-emphasis treatment.

---

## 8. Content cleanup (flag before changing)

Each change is surfaced for Dan's OK, not silently applied:

- Soften unverifiable stats for a brand-new firm: "0 Security Breaches", "40% Efficiency Gain", "24/7 AI Monitoring", "100% Bilingual Support" → honest framing (e.g., capability/commitment language rather than fabricated metrics).
- Unify contact email — draft shows both `hello@bis-rgv.com` (Home) and `hello@bespokeintelligent.com` (Contact). Pick one once domain is chosen.
- Fix `© 2024` → current year.
- Founder credentials on About (20+ yrs IT leadership, M365, security stack, bilingual) kept as-is — verifiable/owned by Dan.

---

## 9. Build order (one project, 3 phases)

1. **Foundation + core site** — Next.js scaffold, Tailwind theme port, `next/font`, next-intl + next-themes, shared layout (Header/Footer), and the 5 core pages in **EN + ES**: Home, Services, Industries, About, Contact (UI only for the form).
2. **Contact automation** — Server Action, Neon + Drizzle `leads` table, Resend notification + bilingual thank-you, validation, success/error states.
3. **Content system** — MDX blog (`/insights`) + case studies (`/work`), bilingual, with index + detail pages; wire the Home "What we think" section and footer links.

Each phase is independently shippable to a Vercel preview.

---

## 10. Out of scope (v1)

- Real domain purchase/DNS (wired in before launch, not part of the build).
- CRM integration, Vercel Workflow drip sequences, calendar booking — architected-for, not built.
- Analytics dashboards (Power BI), client portal, auth — future milestones.
- CMS UI — content lives in message files + MDX, edited in-repo for v1.

---

## 11. Open items to confirm before/at launch

- Final domain + primary contact email.
- Real blog + case-study content (Dan supplies; draft/placeholder used during the build).
- Resend account + verified sending domain.
- Any real client logos/testimonials (draft testimonials are currently illustrative).
