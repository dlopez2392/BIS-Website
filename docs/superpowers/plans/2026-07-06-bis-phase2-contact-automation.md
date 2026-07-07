# BIS Website — Phase 2: Contact Automation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Phase 1 contact form from a UI-only stub into a real, automation-ready pipeline: validate → store the lead in Neon Postgres → email a notification to the company inbox → send the prospect a bilingual thank-you via Resend.

**Architecture:** The form calls a Next.js **Server Action** (`submitContact`). The action delegates to a pure orchestrator, `processContactSubmission(input, deps)`, that is fully unit-testable with fake dependencies. Persistence (Drizzle + Neon HTTP driver) and email (Resend + React Email templates) are isolated behind small modules injected as `deps`. A "never lose a lead" rule returns success if the lead was captured by **either** the database **or** the notification email; the thank-you is best-effort. Everything is structured so a Vercel Workflow / CRM step can be added later by extending `deps`.

**Tech Stack:** Next.js 16.2 Server Actions · Drizzle ORM + `@neondatabase/serverless` (neon-http) · Neon Postgres (Vercel Marketplace) · Resend + `@react-email/components` · zod (reused `contactSchema`) · Vitest (external SDKs mocked — no live network in tests).

## Global Constraints

- Reuse `contactSchema` and `ContactFormValues` from `@/lib/contact-schema` (Phase 1) — do NOT redefine the field shapes. Fields: `fullName`, `businessName`, `email`, `phone`, `industry` (`'legal'|'health'|'mfg'|'logistics'|'other'`), `language` (`'en'|'es'`), `message` (optional, defaults `''`).
- Env vars (exact names): `DATABASE_URL` (Neon), `RESEND_API_KEY`, `CONTACT_NOTIFY_TO` = `bespokeintelligentsolutions@gmail.com`, `CONTACT_FROM` = `Bespoke Intelligent Solutions <hello@bis-rgv.com>` (before domain verification, `onboarding@resend.dev` is an acceptable fallback), `CONTACT_REPLY_TO` = `bespokeintelligentsolutions@gmail.com`.
- **Never lose a lead:** `processContactSubmission` returns `{ ok: true }` if the lead was persisted by the DB insert **OR** the notification email succeeded; returns `{ ok: false, error }` only if BOTH failed or validation failed. The thank-you email is best-effort and never affects the result.
- Email routing: **notification** → `to: CONTACT_NOTIFY_TO`, `replyTo: lead.email` (so Dan replies straight to the prospect). **Thank-you** → `to: lead.email`, `replyTo: CONTACT_REPLY_TO` (prospect replies land in the company Gmail).
- Thank-you email copy is localized by `lead.language` (en/es); the notification email is English (internal). Email copy lives in the email module's own dictionary — NOT next-intl. The one new *form* string (a generic submit error) goes in the `contact` next-intl namespace, EN + ES.
- Modules read env vars **inside functions** (not at import time) so tests can set them; external SDK clients (`resend`, the drizzle `db`) are mocked in tests. No test makes a real network or DB call.
- Node 24, npm. Commands from repo root `C:\Users\danlo\BIS-Website`. Commit after each task with the `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com"` form.
- Repo note: `AGENTS.md` warns Next.js 16.2 may differ from training data — if a Server Action / `next/*` API behaves unexpectedly, consult `node_modules/next/dist/docs/`.

---

### Task 1: Dependencies, Drizzle schema, and the lead-row mapper

**Files:**
- Modify: `package.json` (deps)
- Create: `src/db/schema.ts`, `drizzle.config.ts`
- Create: `src/lib/contact/to-lead-row.ts`
- Test: `src/lib/contact/__tests__/to-lead-row.test.ts`

**Interfaces:**
- Produces: `leads` table (Drizzle pgTable) from `@/db/schema`; `toLeadRow(values: ContactFormValues): NewLead` from `@/lib/contact/to-lead-row`; the `NewLead` type (Drizzle insert type).

- [ ] **Step 1: Install dependencies**

```bash
cd "C:/Users/danlo/BIS-Website"
npm install drizzle-orm @neondatabase/serverless resend @react-email/components @react-email/render
npm install -D drizzle-kit
```

- [ ] **Step 2: Define the Drizzle schema**

Create `src/db/schema.ts`:

```ts
import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core';

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  fullName: text('full_name').notNull(),
  businessName: text('business_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  industry: text('industry').notNull(),
  language: text('language').notNull(),
  message: text('message').notNull().default(''),
  status: text('status').notNull().default('new'),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
```

- [ ] **Step 3: drizzle-kit config**

Create `drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
```

- [ ] **Step 4: Write the failing mapper test**

Create `src/lib/contact/__tests__/to-lead-row.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toLeadRow } from '../to-lead-row';

describe('toLeadRow', () => {
  it('maps validated form values to a lead insert row', () => {
    const row = toLeadRow({
      fullName: 'Ana Reyes', businessName: 'Reyes Law', email: 'ana@reyeslaw.com',
      phone: '956-555-0100', industry: 'legal', language: 'es', message: '',
    });
    expect(row).toEqual({
      fullName: 'Ana Reyes', businessName: 'Reyes Law', email: 'ana@reyeslaw.com',
      phone: '956-555-0100', industry: 'legal', language: 'es', message: '',
    });
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test -- to-lead-row`
Expected: FAIL — cannot resolve `../to-lead-row`.

- [ ] **Step 6: Implement the mapper**

Create `src/lib/contact/to-lead-row.ts`:

```ts
import type { ContactFormValues } from '@/lib/contact-schema';
import type { NewLead } from '@/db/schema';

export function toLeadRow(values: ContactFormValues): NewLead {
  return {
    fullName: values.fullName,
    businessName: values.businessName,
    email: values.email,
    phone: values.phone,
    industry: values.industry,
    language: values.language,
    message: values.message ?? '',
  };
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- to-lead-row`
Expected: PASS.

- [ ] **Step 8: Generate the initial migration (SQL only — not applied yet)**

```bash
npx drizzle-kit generate
```
Expected: a new `drizzle/0000_*.sql` creating the `leads` table. (Applying it to a live DB is Task 7.)

- [ ] **Step 9: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: add drizzle schema, deps, and lead-row mapper"
```

---

### Task 2: Neon DB client + leads repository

**Files:**
- Create: `src/db/index.ts`
- Create: `src/lib/contact/repository.ts`
- Test: `src/lib/contact/__tests__/repository.test.ts`

**Interfaces:**
- Consumes: `leads`, `NewLead` from `@/db/schema`; `toLeadRow` from `@/lib/contact/to-lead-row`.
- Produces: `db` from `@/db`; `insertLead(values: ContactFormValues): Promise<{ id: string }>` from `@/lib/contact/repository`.

- [ ] **Step 1: Create the Neon-backed Drizzle client**

Create `src/db/index.ts`:

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export const db = drizzle(neon(process.env.DATABASE_URL ?? ''), { schema });
```

- [ ] **Step 2: Write the failing repository test (db mocked)**

Create `src/lib/contact/__tests__/repository.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const returning = vi.fn();
const values = vi.fn(() => ({ returning }));
const insert = vi.fn(() => ({ values }));

vi.mock('@/db', () => ({ db: { insert } }));
vi.mock('@/db/schema', () => ({ leads: { __table: 'leads' } }));

import { insertLead } from '../repository';

describe('insertLead', () => {
  beforeEach(() => { insert.mockClear(); values.mockClear(); returning.mockClear(); });

  it('inserts the mapped row and returns the new id', async () => {
    returning.mockResolvedValueOnce([{ id: 'lead-123' }]);
    const result = await insertLead({
      fullName: 'Ana', businessName: 'Acme', email: 'ana@acme.com',
      phone: '956', industry: 'legal', language: 'en', message: '',
    });
    expect(insert).toHaveBeenCalledWith({ __table: 'leads' });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@acme.com', fullName: 'Ana' }));
    expect(result).toEqual({ id: 'lead-123' });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- repository`
Expected: FAIL — cannot resolve `../repository`.

- [ ] **Step 4: Implement the repository**

Create `src/lib/contact/repository.ts`:

```ts
import { db } from '@/db';
import { leads } from '@/db/schema';
import { toLeadRow } from './to-lead-row';
import type { ContactFormValues } from '@/lib/contact-schema';

export async function insertLead(values: ContactFormValues): Promise<{ id: string }> {
  const [row] = await db.insert(leads).values(toLeadRow(values)).returning({ id: leads.id });
  return { id: row.id };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- repository`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: neon db client and leads repository"
```

---

### Task 3: Bilingual email templates (React Email)

**Files:**
- Create: `src/emails/messages.ts`
- Create: `src/emails/ThankYou.tsx`
- Create: `src/emails/LeadNotification.tsx`
- Test: `src/emails/__tests__/templates.test.tsx`

**Interfaces:**
- Consumes: `ContactFormValues` from `@/lib/contact-schema`.
- Produces: `emailStrings` (locale dictionary) from `@/emails/messages`; `ThankYou({ locale, fullName })` and `LeadNotification({ lead })` React components; `thankYouSubject(locale)` helper.

- [ ] **Step 1: Email copy dictionary + subject helper**

Create `src/emails/messages.ts`:

```ts
export const emailStrings = {
  en: {
    subject: 'We received your BIS assessment request',
    greeting: (name: string) => `Hi ${name},`,
    body: "Thanks for reaching out to Bespoke Intelligent Solutions. We received your free-assessment request and will be in touch within one business day. In the meantime, reply to this email with anything you'd like us to know.",
    signoff: '— Dan Lopez, Bespoke Intelligent Solutions',
  },
  es: {
    subject: 'Recibimos tu solicitud de evaluación de BIS',
    greeting: (name: string) => `Hola ${name}:`,
    body: 'Gracias por contactar a Bespoke Intelligent Solutions. Recibimos tu solicitud de evaluación gratuita y nos pondremos en contacto en un día hábil. Mientras tanto, responde a este correo con cualquier cosa que quieras que sepamos.',
    signoff: '— Dan Lopez, Bespoke Intelligent Solutions',
  },
} as const;

export type EmailLocale = keyof typeof emailStrings;

export function thankYouSubject(locale: EmailLocale): string {
  return emailStrings[locale].subject;
}
```

- [ ] **Step 2: Write the failing template test**

Create `src/emails/__tests__/templates.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@react-email/render';
import { ThankYou } from '../ThankYou';
import { LeadNotification } from '../LeadNotification';

describe('email templates', () => {
  it('renders the EN thank-you with an English greeting and body', async () => {
    const html = await render(<ThankYou locale="en" fullName="Ana Reyes" />);
    expect(html).toContain('Hi Ana Reyes');
    expect(html).toContain('Thanks for reaching out');
  });

  it('renders the ES thank-you with Spanish copy', async () => {
    const html = await render(<ThankYou locale="es" fullName="Ana Reyes" />);
    expect(html).toContain('Hola Ana Reyes');
    expect(html).toContain('Gracias por contactar');
  });

  it('renders the internal notification with the lead details', async () => {
    const html = await render(
      <LeadNotification lead={{
        fullName: 'Ana Reyes', businessName: 'Reyes Law', email: 'ana@reyeslaw.com',
        phone: '956-555-0100', industry: 'legal', language: 'es', message: 'Necesito ayuda',
      }} />
    );
    expect(html).toContain('Ana Reyes');
    expect(html).toContain('ana@reyeslaw.com');
    expect(html).toContain('legal');
    expect(html).toContain('Necesito ayuda');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- templates`
Expected: FAIL — cannot resolve `../ThankYou`.

- [ ] **Step 4: Implement the thank-you template**

Create `src/emails/ThankYou.tsx`:

```tsx
import { Html, Head, Body, Container, Text } from '@react-email/components';
import { emailStrings, type EmailLocale } from './messages';

export function ThankYou({ locale, fullName }: { locale: EmailLocale; fullName: string }) {
  const t = emailStrings[locale];
  return (
    <Html lang={locale}>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', background: '#f9f9f9' }}>
        <Container style={{ padding: '24px', background: '#ffffff' }}>
          <Text style={{ fontWeight: 'bold' }}>bis&gt;</Text>
          <Text>{t.greeting(fullName)}</Text>
          <Text>{t.body}</Text>
          <Text>{t.signoff}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ThankYou;
```

- [ ] **Step 5: Implement the notification template**

Create `src/emails/LeadNotification.tsx`:

```tsx
import { Html, Head, Body, Container, Text, Hr } from '@react-email/components';
import type { ContactFormValues } from '@/lib/contact-schema';

export function LeadNotification({ lead }: { lead: ContactFormValues }) {
  const rows: Array<[string, string]> = [
    ['Name', lead.fullName],
    ['Business', lead.businessName],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Industry', lead.industry],
    ['Language', lead.language],
    ['Message', lead.message ?? ''],
  ];
  return (
    <Html lang="en">
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ padding: '24px' }}>
          <Text style={{ fontWeight: 'bold' }}>New free-assessment request</Text>
          <Hr />
          {rows.map(([label, value]) => (
            <Text key={label}><strong>{label}:</strong> {value}</Text>
          ))}
        </Container>
      </Body>
    </Html>
  );
}

export default LeadNotification;
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- templates`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: bilingual thank-you and internal notification email templates"
```

---

### Task 4: Resend sender module

**Files:**
- Create: `src/lib/email/resend.ts`
- Test: `src/lib/email/__tests__/resend.test.ts`

**Interfaces:**
- Consumes: `ThankYou`, `LeadNotification` templates; `thankYouSubject` from `@/emails/messages`; `ContactFormValues`.
- Produces: `sendThankYou(lead: ContactFormValues): Promise<void>` and `sendLeadNotification(lead: ContactFormValues): Promise<void>` from `@/lib/email/resend`. Both throw on send failure (callers decide how to handle).

- [ ] **Step 1: Write the failing sender test (Resend mocked)**

Create `src/lib/email/__tests__/resend.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.fn();
vi.mock('resend', () => ({ Resend: vi.fn(() => ({ emails: { send } })) }));

const lead = {
  fullName: 'Ana Reyes', businessName: 'Reyes Law', email: 'ana@reyeslaw.com',
  phone: '956-555-0100', industry: 'legal' as const, language: 'es' as const, message: '',
};

describe('resend sender', () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ data: { id: 'email-1' }, error: null });
    process.env.RESEND_API_KEY = 'test-key';
    process.env.CONTACT_FROM = 'BIS <hello@bis-rgv.com>';
    process.env.CONTACT_NOTIFY_TO = 'bespokeintelligentsolutions@gmail.com';
    process.env.CONTACT_REPLY_TO = 'bespokeintelligentsolutions@gmail.com';
  });

  it('sends the thank-you to the prospect in their language with company reply-to', async () => {
    const { sendThankYou } = await import('../resend');
    await sendThankYou(lead);
    const arg = send.mock.calls[0][0];
    expect(arg.to).toBe('ana@reyeslaw.com');
    expect(arg.from).toBe('BIS <hello@bis-rgv.com>');
    expect(arg.replyTo).toBe('bespokeintelligentsolutions@gmail.com');
    expect(arg.subject).toContain('Recibimos'); // ES subject
    expect(arg.react).toBeTruthy();
  });

  it('sends the notification to the company inbox with the prospect as reply-to', async () => {
    const { sendLeadNotification } = await import('../resend');
    await sendLeadNotification(lead);
    const arg = send.mock.calls[0][0];
    expect(arg.to).toBe('bespokeintelligentsolutions@gmail.com');
    expect(arg.replyTo).toBe('ana@reyeslaw.com');
    expect(arg.subject).toContain('Reyes Law');
  });

  it('throws when Resend returns an error', async () => {
    send.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    const { sendThankYou } = await import('../resend');
    await expect(sendThankYou(lead)).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- email/__tests__/resend`
Expected: FAIL — cannot resolve `../resend`.

- [ ] **Step 3: Implement the sender**

Create `src/lib/email/resend.ts`:

```ts
import { Resend } from 'resend';
import { ThankYou } from '@/emails/ThankYou';
import { LeadNotification } from '@/emails/LeadNotification';
import { thankYouSubject, type EmailLocale } from '@/emails/messages';
import type { ContactFormValues } from '@/lib/contact-schema';

function client(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendThankYou(lead: ContactFormValues): Promise<void> {
  const locale = lead.language as EmailLocale;
  const { error } = await client().emails.send({
    from: process.env.CONTACT_FROM ?? 'onboarding@resend.dev',
    to: lead.email,
    replyTo: process.env.CONTACT_REPLY_TO ?? 'bespokeintelligentsolutions@gmail.com',
    subject: thankYouSubject(locale),
    react: ThankYou({ locale, fullName: lead.fullName }),
  });
  if (error) throw new Error(error.message);
}

export async function sendLeadNotification(lead: ContactFormValues): Promise<void> {
  const { error } = await client().emails.send({
    from: process.env.CONTACT_FROM ?? 'onboarding@resend.dev',
    to: process.env.CONTACT_NOTIFY_TO ?? 'bespokeintelligentsolutions@gmail.com',
    replyTo: lead.email,
    subject: `New assessment request — ${lead.businessName}`,
    react: LeadNotification({ lead }),
  });
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- email/__tests__/resend`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: resend sender for thank-you and lead notification"
```

---

### Task 5: Orchestrator + Server Action

**Files:**
- Create: `src/lib/contact/process.ts`
- Create: `src/app/[locale]/contact/actions.ts`
- Test: `src/lib/contact/__tests__/process.test.ts`

**Interfaces:**
- Consumes: `contactSchema` from `@/lib/contact-schema`; `insertLead`, `sendLeadNotification`, `sendThankYou`.
- Produces: `ContactResult = { ok: true } | { ok: false; error: 'invalid' | 'failed' }`; `processContactSubmission(input: unknown, deps: ContactDeps): Promise<ContactResult>`; the `'use server'` action `submitContact(input: unknown): Promise<ContactResult>` from `@/app/[locale]/contact/actions`.

- [ ] **Step 1: Write the failing orchestrator test**

Create `src/lib/contact/__tests__/process.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { processContactSubmission, type ContactDeps } from '../process';

const valid = {
  fullName: 'Ana', businessName: 'Acme', email: 'ana@acme.com',
  phone: '956-555-0100', industry: 'legal', language: 'en', message: '',
};

function deps(over: Partial<ContactDeps> = {}): ContactDeps {
  return {
    insertLead: vi.fn().mockResolvedValue({ id: 'lead-1' }),
    sendLeadNotification: vi.fn().mockResolvedValue(undefined),
    sendThankYou: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

describe('processContactSubmission', () => {
  it('happy path: validates, stores, notifies, thanks, returns ok', async () => {
    const d = deps();
    const r = await processContactSubmission(valid, d);
    expect(r).toEqual({ ok: true });
    expect(d.insertLead).toHaveBeenCalledOnce();
    expect(d.sendLeadNotification).toHaveBeenCalledOnce();
    expect(d.sendThankYou).toHaveBeenCalledOnce();
  });

  it('rejects invalid input without storing or emailing', async () => {
    const d = deps();
    const r = await processContactSubmission({ ...valid, email: 'nope' }, d);
    expect(r).toEqual({ ok: false, error: 'invalid' });
    expect(d.insertLead).not.toHaveBeenCalled();
    expect(d.sendLeadNotification).not.toHaveBeenCalled();
  });

  it('still succeeds if the DB insert fails but the notification email sends', async () => {
    const d = deps({ insertLead: vi.fn().mockRejectedValue(new Error('db down')) });
    const r = await processContactSubmission(valid, d);
    expect(r).toEqual({ ok: true });
    expect(d.sendLeadNotification).toHaveBeenCalledOnce();
  });

  it('fails only when both the DB insert and the notification email fail', async () => {
    const d = deps({
      insertLead: vi.fn().mockRejectedValue(new Error('db down')),
      sendLeadNotification: vi.fn().mockRejectedValue(new Error('mail down')),
    });
    const r = await processContactSubmission(valid, d);
    expect(r).toEqual({ ok: false, error: 'failed' });
  });

  it('a failing thank-you never affects a successful result', async () => {
    const d = deps({ sendThankYou: vi.fn().mockRejectedValue(new Error('mail down')) });
    const r = await processContactSubmission(valid, d);
    expect(r).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- contact/__tests__/process`
Expected: FAIL — cannot resolve `../process`.

- [ ] **Step 3: Implement the orchestrator**

Create `src/lib/contact/process.ts`:

```ts
import { contactSchema, type ContactFormValues } from '@/lib/contact-schema';

export type ContactResult = { ok: true } | { ok: false; error: 'invalid' | 'failed' };

export interface ContactDeps {
  insertLead: (v: ContactFormValues) => Promise<{ id: string }>;
  sendLeadNotification: (v: ContactFormValues) => Promise<void>;
  sendThankYou: (v: ContactFormValues) => Promise<void>;
}

export async function processContactSubmission(input: unknown, deps: ContactDeps): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const lead = parsed.data;

  const [dbResult, notifyResult] = await Promise.allSettled([
    deps.insertLead(lead),
    deps.sendLeadNotification(lead),
  ]);
  const captured = dbResult.status === 'fulfilled' || notifyResult.status === 'fulfilled';
  if (!captured) return { ok: false, error: 'failed' };

  // Best-effort thank-you — never affects the result.
  try { await deps.sendThankYou(lead); } catch { /* logged upstream; ignore */ }

  return { ok: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- contact/__tests__/process`
Expected: PASS (5 tests).

- [ ] **Step 5: Create the Server Action wiring real dependencies**

Create `src/app/[locale]/contact/actions.ts`:

```ts
'use server';

import { processContactSubmission, type ContactResult } from '@/lib/contact/process';
import { insertLead } from '@/lib/contact/repository';
import { sendLeadNotification, sendThankYou } from '@/lib/email/resend';

export async function submitContact(input: unknown): Promise<ContactResult> {
  return processContactSubmission(input, { insertLead, sendLeadNotification, sendThankYou });
}
```

- [ ] **Step 6: Verify build + full test run**

Run: `npm test`
Expected: all pass.
Run: `npm run build`
Expected: build succeeds (the Server Action compiles; `DATABASE_URL`/`RESEND_API_KEY` are read lazily so a build without them still compiles).

- [ ] **Step 7: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: contact orchestrator with never-lose-a-lead policy and server action"
```

---

### Task 6: Wire the ContactForm to the Server Action

**Files:**
- Modify: `src/components/contact/ContactForm.tsx`
- Modify: `messages/en.json`, `messages/es.json` (add `contact.errorGeneric`)
- Modify: `e2e/contact.spec.ts` (adjust for real backend)
- Test: `src/components/contact/__tests__/ContactForm.test.tsx`

**Interfaces:**
- Consumes: `submitContact` from `@/app/[locale]/contact/actions`; `useTranslations('contact')`.
- Produces: a form whose valid submit calls `submitContact`, shows the success state on `{ ok: true }`, and shows `contact.errorGeneric` on `{ ok: false }`.

- [ ] **Step 1: Add the error message key (both locales)**

In `messages/en.json` `contact`, add: `"errorGeneric": "Something went wrong sending your request. Please email hello@bis-rgv.com and we'll take it from there."`
In `messages/es.json` `contact`, add: `"errorGeneric": "Algo salió mal al enviar tu solicitud. Escríbenos a hello@bis-rgv.com y lo resolvemos."`

- [ ] **Step 2: Write the failing component test (action mocked)**

Create `src/components/contact/__tests__/ContactForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';

const submitContact = vi.fn();
vi.mock('@/app/[locale]/contact/actions', () => ({ submitContact: (...a: unknown[]) => submitContact(...a) }));

import { ContactForm } from '../ContactForm';

const messages = { contact: {
  fullName: 'Full Name', businessName: 'Business Name', email: 'Email Address', phone: 'Phone Number',
  industry: 'Industry', industryLegal: 'Legal', industryHealth: 'Healthcare', industryMfg: 'Manufacturing',
  industryLogistics: 'Logistics', industryOther: 'Other', language: 'Preferred Language',
  message: 'Message', submit: 'Book my free assessment', success: 'Thanks — we received your request.',
  errRequired: 'This field is required', errEmail: 'Enter a valid email',
  errorGeneric: 'Something went wrong sending your request.',
} };

function fill() {
  return render(<NextIntlClientProvider locale="en" messages={messages}><ContactForm /></NextIntlClientProvider>);
}
async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Full Name'), 'Ana Reyes');
  await user.type(screen.getByLabelText('Business Name'), 'Reyes Law');
  await user.type(screen.getByLabelText('Email Address'), 'ana@reyeslaw.com');
  await user.type(screen.getByLabelText('Phone Number'), '956-555-0100');
}

describe('ContactForm', () => {
  it('shows the success state when the action returns ok', async () => {
    const user = userEvent.setup();
    submitContact.mockResolvedValueOnce({ ok: true });
    fill();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Book my free assessment/i }));
    expect(await screen.findByText(/we received your request/i)).toBeTruthy();
    expect(submitContact).toHaveBeenCalledOnce();
  });

  it('shows the generic error when the action fails', async () => {
    const user = userEvent.setup();
    submitContact.mockResolvedValueOnce({ ok: false, error: 'failed' });
    fill();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Book my free assessment/i }));
    expect(await screen.findByText(/Something went wrong/i)).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- ContactForm`
Expected: FAIL — the current form's stub `onSubmit` never calls `submitContact`, so the assertions fail.

- [ ] **Step 4: Rewire the form's submit handler**

In `src/components/contact/ContactForm.tsx`:
- Add import: `import { submitContact } from '@/app/[locale]/contact/actions';`
- Add error state: `const [errored, setErrored] = useState(false);`
- Replace the stub `onSubmit` with:

```tsx
const onSubmit = async (values: ContactFormValues) => {
  setErrored(false);
  const result = await submitContact(values);
  if (result.ok) { setSent(true); } else { setErrored(true); }
};
```

- Above the submit button, render the error when `errored` is true:

```tsx
{errored && <p role="alert" className="text-sm text-red-600">{t('errorGeneric')}</p>}
```

(Keep the existing `sent` success block, the zod resolver, and all field markup/labels unchanged.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- ContactForm`
Expected: PASS (2 tests).

- [ ] **Step 6: Adjust the contact e2e for the real backend**

The Phase 1 e2e submitted the form and asserted the local success state. With a real Server Action, a full submit in e2e would hit the DB/Resend. Keep the e2e to the **validation path only** (needs no backend). Replace `e2e/contact.spec.ts` with:

```ts
import { test, expect } from '@playwright/test';

test('contact form shows validation errors on empty submit', async ({ page }) => {
  await page.goto('/en/contact');
  await page.getByRole('button', { name: /Book my free assessment/i }).click();
  await expect(page.getByText('This field is required').first()).toBeVisible();
});
```

- [ ] **Step 7: Full verification**

Run: `npm test` → all pass.
Run: `npm run build` → succeeds.
Run: `npm run e2e -- contact` → passes.

- [ ] **Step 8: Commit**

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: wire contact form to submitContact server action with error state"
```

---

### Task 7: Live services setup, migration, and smoke test (human-run checklist)

> This task provisions real infrastructure and cannot be done by an automated subagent. The controller runs these WITH Dan (dashboard steps + secrets). Each step lists the exact command or action. Do NOT commit any secret values.

**Files:**
- Modify: `.env.local` (local secrets, gitignored — never committed)
- No source changes expected; if the Resend `from` needs the fallback, it's env-only.

- [ ] **Step 1: Provision Neon Postgres via Vercel Marketplace**
  - `vercel integration add neon` (or Vercel dashboard → Storage → Create → Neon). Attach it to the `bis-website` project. This sets `DATABASE_URL` (and/or `POSTGRES_URL`) in the project's env.
  - If only `POSTGRES_URL` is set, add `DATABASE_URL` too: `vercel env add DATABASE_URL production` (paste the Neon pooled connection string).

- [ ] **Step 2: Pull env locally and apply the migration**
  - `vercel env pull .env.local`
  - Confirm `DATABASE_URL` is present in `.env.local`.
  - Apply the Task 1 migration to Neon: `npx drizzle-kit migrate` (uses `DATABASE_URL`). Expected: the `leads` table is created. Verify: `npx drizzle-kit studio` or a quick `node` insert/select smoke.

- [ ] **Step 3: Create Resend + verify bis-rgv.com**
  - Dan signs up at resend.com, creates an API key.
  - In Resend → Domains → Add `bis-rgv.com`. Resend shows DNS records (SPF `TXT`, DKIM `TXT`, and a MX/return-path). Because Vercel manages `bis-rgv.com` DNS, add each record via CLI, e.g.:
    - `vercel dns add bis-rgv.com <name> TXT "<value>"` (DKIM/SPF)
    - `vercel dns add bis-rgv.com send MX "feedback-smtp.us-east-1.amazonses.com" 10` (return-path — use the exact host/priority Resend shows)
  - Wait for Resend to mark the domain **Verified** (usually minutes on Vercel DNS).

- [ ] **Step 4: Set the email env vars (production + local)**
  - `vercel env add RESEND_API_KEY production` (paste the key) — also `preview` if you want previews to send.
  - `printf 'Bespoke Intelligent Solutions <hello@bis-rgv.com>' | vercel env add CONTACT_FROM production`
  - `printf 'bespokeintelligentsolutions@gmail.com' | vercel env add CONTACT_NOTIFY_TO production`
  - `printf 'bespokeintelligentsolutions@gmail.com' | vercel env add CONTACT_REPLY_TO production`
  - Re-pull for local: `vercel env pull .env.local`.
  - (Until the domain is Verified, `CONTACT_FROM` may be left unset so the code falls back to `onboarding@resend.dev` for testing.)

- [ ] **Step 5: Deploy and smoke-test a real submission**
  - `vercel --prod --yes` (or push to `main` to auto-deploy).
  - Visit `https://bis-rgv.com/en/contact`, submit a real test entry (use Dan's own email as the prospect).
  - Confirm: (a) a notification email arrives at `bespokeintelligentsolutions@gmail.com` with the lead details and reply-to = the prospect; (b) the prospect address receives the bilingual thank-you (send one EN and one ES by toggling Preferred Language); (c) the row appears in Neon (`drizzle-kit studio` or a `select` on `leads`).
  - Verify the "never lose a lead" path informally: it's covered by unit tests; no destructive test needed in prod.

- [ ] **Step 6: Record completion**
  - Note the Neon project + that `leads` is live, and that Resend is verified, in the project memory / ledger. No code commit required for this task unless env fallbacks changed.

---

## Self-review notes (addressed)

- **Spec §6 coverage:** validate (Task 5 via `contactSchema`), store lead in Neon (Tasks 1-2), notify Dan (Tasks 3-4, routed to `CONTACT_NOTIFY_TO`), bilingual thank-you (Tasks 3-4, localized by `lead.language`), wire form (Task 6), extensibility for Vercel Workflow/CRM (the `ContactDeps` injection seam in Task 5). Live provisioning (Task 7).
- **Never-lose-a-lead** is implemented and directly tested (Task 5 tests 3-4).
- **No live network/DB in tests** — Resend and `@/db` are mocked; orchestrator uses fakes.
- **Type consistency:** `ContactResult`, `ContactDeps`, `insertLead`, `sendThankYou`, `sendLeadNotification`, `toLeadRow`, `NewLead` are used with identical signatures across tasks.

## Out of scope (later)
- Vercel Workflow drip/follow-up sequences, CRM sync, calendar booking, AI lead-scoring — the `ContactDeps` seam is where they attach.
- Admin UI / lead dashboard (use `drizzle-kit studio` or the Neon console for now).
- Rate limiting / spam protection (add a honeypot or Turnstile in a follow-up if spam appears).
