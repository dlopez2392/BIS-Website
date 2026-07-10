# Bilingual AI Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A floating bilingual chat assistant (DeepSeek) that answers BIS questions, qualifies interest, and captures leads into the existing Phase 2 pipeline via a tool.

**Architecture:** Pure, testable units first (a system-prompt builder + a `processCapturedLead` orchestrator that reuses Phase 2 `insertLead`/`sendLeadNotification`), then a streaming `POST /api/chat` route (Vercel AI SDK `streamText` + DeepSeek + a `capture_lead` tool + cost caps), then a client `ChatWidget` (AI SDK `useChat`) mounted site-wide behind an enable flag.

**Tech Stack:** Next.js 16.2 App Router · Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/deepseek`) · next-intl v4 · next-themes · zod · Vitest + Playwright.

## Global Constraints

- Work from repo root `C:\Users\danlo\BIS-Website`. Node 24, npm.
- LLM: DeepSeek model `deepseek-chat` via `@ai-sdk/deepseek`; server-only `DEEPSEEK_API_KEY`. NEVER call a live LLM in tests (the model/route is mocked).
- The widget is gated on `process.env.NEXT_PUBLIC_AI_ENABLED === 'true'` — renders nothing otherwise, so shipping before the key exists breaks nothing.
- `capture_lead` reuses Phase 2 `insertLead` (from `@/lib/contact/repository`) + `sendLeadNotification` (from `@/lib/email/resend`) with a `ContactFormValues` row: `{ fullName, businessName: '', email, phone: '', industry: 'other', language, message: '[via AI assistant] ' + need }`. NO DB schema change. Never lose a captured lead: return success if the insert succeeds; the notification is best-effort.
- All new user-facing strings live in `messages/en.json` + `messages/es.json` `chat` namespace, identical key sets.
- Cost/abuse control on the public `/api/chat`: capped `maxOutputTokens` (500), a per-request conversation message cap (reject > 20 messages), and a basic per-IP in-process rate limit (return 429). Upstash is a documented fast-follow, NOT built here.
- **AI SDK version note:** the Vercel AI SDK changes fast. This plan uses AI SDK v5 patterns (`streamText`, `tool({ inputSchema, execute })`, `result.toUIMessageStreamResponse()`, `useChat` from `@ai-sdk/react` with `DefaultChatTransport`). Before writing route/widget code, the implementer MUST verify the exact installed API in `node_modules/ai` and `node_modules/@ai-sdk/react` (check their `dist/index.d.ts` / README) and adapt method/prop names to the installed version, noting any deviation. The `AGENTS.md` Next-16 caveat applies too.
- Commit after each task with `git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit`.

---

### Task 1: System-prompt builder + `capture_lead` orchestrator (pure units)

**Files:**
- Modify: `package.json` (add `ai @ai-sdk/react @ai-sdk/deepseek`)
- Create: `src/lib/ai/system-prompt.ts`, `src/lib/ai/capture-lead.ts`
- Test: `src/lib/ai/__tests__/system-prompt.test.ts`, `src/lib/ai/__tests__/capture-lead.test.ts`

**Interfaces:**
- Consumes: `business` from `@/lib/seo/business`; `ContactFormValues` from `@/lib/contact-schema`.
- Produces: `buildSystemPrompt({ bookingLink }: { bookingLink: string }): string`; `captureLeadSchema` (zod) + `CaptureLeadArgs` type; `processCapturedLead(args: CaptureLeadArgs, deps: CaptureDeps): Promise<{ ok: boolean; message: string }>` with `CaptureDeps = { insertLead, sendLeadNotification }`.

- [ ] **Step 1: Install deps**

```bash
cd "C:/Users/danlo/BIS-Website"
npm install ai @ai-sdk/react @ai-sdk/deepseek
```

- [ ] **Step 2: Write the failing system-prompt test**

Create `src/lib/ai/__tests__/system-prompt.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../system-prompt';

describe('buildSystemPrompt', () => {
  it('includes BIS facts, the booking link, and the bilingual/scope rules', () => {
    const p = buildSystemPrompt({ bookingLink: 'https://cal.com/dan-lopez-utygjo/free-assessment' });
    expect(p).toContain('Bespoke Intelligent Solutions');
    expect(p).toContain('Rio Grande Valley');
    expect(p).toContain('https://cal.com/dan-lopez-utygjo/free-assessment');
    expect(p).toMatch(/Spanish/i);
    expect(p).toMatch(/capture_lead/);
    expect(p).toMatch(/do not (invent|make up)/i);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- system-prompt`
Expected: FAIL — cannot resolve `../system-prompt`.

- [ ] **Step 4: Implement the system-prompt builder**

Create `src/lib/ai/system-prompt.ts`:

```ts
import { business } from '@/lib/seo/business';

export function buildSystemPrompt({ bookingLink }: { bookingLink: string }): string {
  return [
    `You are the AI concierge for ${business.name} (BIS), an IT and AI consulting firm founded by ${business.founder}, serving the Rio Grande Valley (McAllen, Harlingen, Brownsville, Edinburg) in South Texas.`,
    `Services: (1) AI & Automation, (2) IT Consulting & Security, (3) Website Design. Industries served: Legal, Medical & Dental, Logistics & Freight, Skilled Trades, Agriculture. Contact email: ${business.email}.`,
    `LANGUAGE: Reply in the visitor's language. If they write Spanish, answer in Spanish; if English, English. BIS is fully bilingual (English and Spanish).`,
    `STYLE: Concise, warm, professional. 1-3 short paragraphs max. Never use markdown headings.`,
    `SCOPE: Only discuss BIS, its services, and how AI/IT/web work could help the visitor's business. Politely decline and redirect anything off-topic. Do NOT give legal, medical, or financial advice.`,
    `HONESTY: Do NOT invent or make up prices, timelines, guarantees, or specific commitments. If asked for pricing, say it depends on scope and offer a free assessment.`,
    `LEAD CAPTURE: When the visitor shows interest in working with BIS, ask for their name, email, and a one-line description of their need. Once you have all three, call the capture_lead tool. After it succeeds, thank them and share this booking link so they can book a free assessment call: ${bookingLink}`,
  ].join('\n\n');
}
```

- [ ] **Step 5: Write the failing capture-lead test**

Create `src/lib/ai/__tests__/capture-lead.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { processCapturedLead, captureLeadSchema, type CaptureDeps } from '../capture-lead';

const args = { fullName: 'Ana Reyes', email: 'ana@reyeslaw.com', need: 'AI intake for my law firm', language: 'en' as const };

function deps(over: Partial<CaptureDeps> = {}): CaptureDeps {
  return {
    insertLead: vi.fn().mockResolvedValue({ id: 'lead-1' }),
    sendLeadNotification: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

describe('captureLeadSchema', () => {
  it('rejects an invalid email', () => {
    expect(captureLeadSchema.safeParse({ ...args, email: 'nope' }).success).toBe(false);
  });
});

describe('processCapturedLead', () => {
  it('maps to a lead row, inserts, notifies, returns ok', async () => {
    const d = deps();
    const r = await processCapturedLead(args, d);
    expect(r.ok).toBe(true);
    expect(d.insertLead).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Ana Reyes', email: 'ana@reyeslaw.com', businessName: '', phone: '',
      industry: 'other', language: 'en', message: '[via AI assistant] AI intake for my law firm',
    }));
    expect(d.sendLeadNotification).toHaveBeenCalledOnce();
  });

  it('still returns ok if the notification email fails (best-effort)', async () => {
    const d = deps({ sendLeadNotification: vi.fn().mockRejectedValue(new Error('mail down')) });
    const r = await processCapturedLead(args, d);
    expect(r.ok).toBe(true);
  });

  it('returns not-ok if the DB insert fails', async () => {
    const d = deps({ insertLead: vi.fn().mockRejectedValue(new Error('db down')) });
    const r = await processCapturedLead(args, d);
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- capture-lead`
Expected: FAIL — cannot resolve `../capture-lead`.

- [ ] **Step 7: Implement the capture-lead orchestrator**

Create `src/lib/ai/capture-lead.ts`:

```ts
import { z } from 'zod';
import type { ContactFormValues } from '@/lib/contact-schema';

export const captureLeadSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  need: z.string().min(1),
  language: z.enum(['en', 'es']),
});
export type CaptureLeadArgs = z.infer<typeof captureLeadSchema>;

export interface CaptureDeps {
  insertLead: (v: ContactFormValues) => Promise<{ id: string }>;
  sendLeadNotification: (v: ContactFormValues) => Promise<void>;
}

export async function processCapturedLead(
  args: CaptureLeadArgs,
  deps: CaptureDeps,
): Promise<{ ok: boolean; message: string }> {
  const lead: ContactFormValues = {
    fullName: args.fullName,
    businessName: '',
    email: args.email,
    phone: '',
    industry: 'other',
    language: args.language,
    message: `[via AI assistant] ${args.need}`,
  };
  try {
    await deps.insertLead(lead);
  } catch (err) {
    console.error('[assistant] capture_lead insert failed', err);
    return { ok: false, message: 'Sorry — something went wrong saving your details. Please email us instead.' };
  }
  try {
    await deps.sendLeadNotification(lead);
  } catch (err) {
    console.error('[assistant] capture_lead notification failed (best-effort)', err);
  }
  return { ok: true, message: 'Saved. Our team will follow up shortly.' };
}
```

- [ ] **Step 8: Run tests + commit**

Run: `npm test -- "ai/__tests__"` → all pass. `npm run build` → succeeds. `npm run lint` → clean.

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: AI assistant system prompt + capture_lead orchestrator"
```

---

### Task 2: Streaming `/api/chat` route (DeepSeek + capture_lead tool + cost caps)

**Files:**
- Create: `src/app/api/chat/route.ts`, `src/lib/ai/rate-limit.ts`
- Test: `src/lib/ai/__tests__/rate-limit.test.ts`

**Interfaces:**
- Consumes: `buildSystemPrompt`, `processCapturedLead`, `captureLeadSchema` (Task 1); `insertLead`, `sendLeadNotification` (Phase 2).
- Produces: `POST /api/chat` streaming endpoint; `rateLimit(ip: string): boolean` (true = allowed) from `@/lib/ai/rate-limit`.

- [ ] **Step 1: Write the failing rate-limit test**

Create `src/lib/ai/__tests__/rate-limit.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, __resetRateLimit } from '../rate-limit';

describe('rateLimit', () => {
  beforeEach(() => __resetRateLimit());
  it('allows up to the limit then blocks the same IP', () => {
    const ip = '1.2.3.4';
    let allowed = 0;
    for (let i = 0; i < 12; i++) if (rateLimit(ip)) allowed++;
    expect(allowed).toBe(10); // LIMIT = 10 per window
    expect(rateLimit(ip)).toBe(false);
    expect(rateLimit('9.9.9.9')).toBe(true); // different IP unaffected
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rate-limit`
Expected: FAIL — cannot resolve `../rate-limit`.

- [ ] **Step 3: Implement the in-process rate limiter**

Create `src/lib/ai/rate-limit.ts`:

```ts
const LIMIT = 10;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export function rateLimit(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= LIMIT) { hits.set(ip, arr); return false; }
  arr.push(now);
  hits.set(ip, arr);
  return true;
}

export function __resetRateLimit(): void { hits.clear(); }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rate-limit`
Expected: PASS.

- [ ] **Step 5: Implement the chat route**

> Before writing this file, open `node_modules/ai/README.md` (or `dist/index.d.ts`) and `node_modules/@ai-sdk/deepseek/README.md` to confirm the installed `streamText`, `tool`, and DeepSeek-provider API. The code below targets AI SDK v5; adapt names/shapes to the installed version and note deviations in the report.

Create `src/app/api/chat/route.ts`:

```ts
import { streamText, tool, convertToModelMessages, type UIMessage } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { captureLeadSchema, processCapturedLead } from '@/lib/ai/capture-lead';
import { insertLead } from '@/lib/contact/repository';
import { sendLeadNotification } from '@/lib/email/resend';
import { rateLimit } from '@/lib/ai/rate-limit';

export const maxDuration = 30;
const MAX_MESSAGES = 20;
const BOOKING_LINK = `https://cal.com/${process.env.NEXT_PUBLIC_CALCOM_LINK ?? 'dan-lopez-utygjo/free-assessment'}`;

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(ip)) return new Response('Too many requests', { status: 429 });

  const { messages }: { messages: UIMessage[] } = await req.json();
  if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
    return new Response('Bad request', { status: 400 });
  }

  const result = streamText({
    model: deepseek('deepseek-chat'),
    system: buildSystemPrompt({ bookingLink: BOOKING_LINK }),
    messages: convertToModelMessages(messages),
    temperature: 0.4,
    maxOutputTokens: 500,
    tools: {
      capture_lead: tool({
        description: "Save a qualified lead's name, email, and need. Call once you have all three.",
        inputSchema: captureLeadSchema,
        execute: async (args) =>
          processCapturedLead(args, { insertLead, sendLeadNotification }),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

- [ ] **Step 6: Build + commit**

Run: `npm test` → all pass. `npm run build` → succeeds (route compiles; `DEEPSEEK_API_KEY` is read lazily by the provider, so a build without it still compiles). `npm run lint` → clean.

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: streaming /api/chat route with deepseek, capture_lead tool, cost caps"
```

---

### Task 3: ChatWidget (floating bubble) + layout mount + bilingual copy

**Files:**
- Create: `src/components/chat/ChatWidget.tsx`
- Modify: `src/app/[locale]/layout.tsx` (mount the widget)
- Modify: `messages/en.json`, `messages/es.json` (`chat` namespace)
- Test: `src/components/chat/__tests__/ChatWidget.test.tsx`, `e2e/chat.spec.ts`

**Interfaces:**
- Consumes: `useChat` from `@ai-sdk/react`; `useTranslations` from `next-intl`; `POST /api/chat` (Task 2).
- Produces: `<ChatWidget />` — a floating bubble that opens a chat panel; renders `null` unless `process.env.NEXT_PUBLIC_AI_ENABLED === 'true'`.

- [ ] **Step 1: Add chat copy (EN)**

In `messages/en.json`, add a top-level `chat` namespace:

```json
"chat": {
  "open": "Chat with us",
  "title": "BIS Assistant",
  "greeting": "Hi! I'm the BIS assistant. Ask me about AI, IT, or web for your Valley business — I can also set you up with a free assessment.",
  "placeholder": "Type your message…",
  "send": "Send",
  "close": "Close chat"
}
```

- [ ] **Step 2: Add chat copy (ES)**

In `messages/es.json`, add:

```json
"chat": {
  "open": "Chatea con nosotros",
  "title": "Asistente de BIS",
  "greeting": "¡Hola! Soy el asistente de BIS. Pregúntame sobre IA, IT o web para tu negocio en el Valle — también puedo agendarte una evaluación gratuita.",
  "placeholder": "Escribe tu mensaje…",
  "send": "Enviar",
  "close": "Cerrar chat"
}
```

- [ ] **Step 3: Write the failing widget test**

Create `src/components/chat/__tests__/ChatWidget.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({ messages: [], sendMessage: vi.fn(), status: 'ready' }),
}));

import { ChatWidget } from '../ChatWidget';

const messages = { chat: {
  open: 'Chat with us', title: 'BIS Assistant', greeting: 'Hi!',
  placeholder: 'Type…', send: 'Send', close: 'Close chat',
} };
function renderWidget() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}><ChatWidget /></NextIntlClientProvider>
  );
}

describe('ChatWidget', () => {
  const orig = process.env.NEXT_PUBLIC_AI_ENABLED;
  afterEach(() => { process.env.NEXT_PUBLIC_AI_ENABLED = orig; });

  it('renders nothing when the assistant is disabled', () => {
    process.env.NEXT_PUBLIC_AI_ENABLED = 'false';
    const { container } = renderWidget();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the launcher button when enabled', () => {
    process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
    renderWidget();
    expect(screen.getByRole('button', { name: /Chat with us/i })).toBeTruthy();
  });
});
```

Note: `NEXT_PUBLIC_*` env vars are inlined by the bundler at build time; in Vitest they're read from `process.env` at runtime, so this test works by setting `process.env.NEXT_PUBLIC_AI_ENABLED` before render. If the installed Next/bundler inlines it such that the test can't toggle it, gate the component on a small `isAiEnabled()` helper in `src/lib/ai/enabled.ts` (`export const isAiEnabled = () => process.env.NEXT_PUBLIC_AI_ENABLED === 'true';`) and mock that helper instead — note the change in your report.

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- ChatWidget`
Expected: FAIL — cannot resolve `../ChatWidget`.

- [ ] **Step 5: Implement ChatWidget**

> Verify the installed `useChat` API (`@ai-sdk/react`) first — v5 exposes `messages`, `sendMessage`, `status`, and a `DefaultChatTransport`. Adapt the input-handling to the installed version; the test mock above matches the v5 shape.

Create `src/components/chat/ChatWidget.tsx`:

```tsx
'use client';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { useTranslations } from 'next-intl';
import { MessageCircle, X, Send } from 'lucide-react';

export function ChatWidget() {
  const t = useTranslations('chat');
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  if (process.env.NEXT_PUBLIC_AI_ENABLED !== 'true') return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || messages.length >= 18) return;
    sendMessage({ text });
    setInput('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="flex h-[28rem] w-80 flex-col rounded-xl border border-hairline bg-surface-alt shadow-xl">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <span className="font-bold text-ink">{t('title')}</span>
            <button aria-label={t('close')} onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink"><X size={18} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            <p className="text-ink-muted">{t('greeting')}</p>
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'text-right' : ''}>
                <span className={m.role === 'user' ? 'inline-block rounded-lg bg-primary px-3 py-2 text-on-primary' : 'inline-block rounded-lg bg-surface px-3 py-2 text-ink'}>
                  {m.parts.filter((p) => p.type === 'text').map((p, i) => <span key={i}>{(p as { text: string }).text}</span>)}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={submit} className="flex gap-2 border-t border-hairline p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('placeholder')}
              className="flex-1 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink" />
            <button type="submit" aria-label={t('send')} disabled={status !== 'ready'}
              className="rounded-md bg-primary px-3 text-on-primary disabled:opacity-50"><Send size={16} /></button>
          </form>
        </div>
      ) : (
        <button aria-label={t('open')} onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg">
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- ChatWidget`
Expected: PASS (both cases).

- [ ] **Step 7: Mount the widget in the layout**

In `src/app/[locale]/layout.tsx`, import and render `<ChatWidget />` inside `<body>` (e.g. right after `<Footer />`, still inside `NextIntlClientProvider`):

```tsx
import { ChatWidget } from '@/components/chat/ChatWidget';
// ...inside the provider, after <Footer />:
          <ChatWidget />
```

- [ ] **Step 8: Write + run the chat e2e**

Create `e2e/chat.spec.ts` (only meaningful when the flag is on locally; assert the bubble is reachable or absent per the env):

```ts
import { test, expect } from '@playwright/test';

test('chat launcher appears only when enabled', async ({ page }) => {
  await page.goto('/en');
  const launcher = page.getByRole('button', { name: /Chat with us/i });
  if (process.env.NEXT_PUBLIC_AI_ENABLED === 'true') {
    await expect(launcher).toBeVisible();
    await launcher.click();
    await expect(page.getByText('BIS Assistant')).toBeVisible();
  } else {
    await expect(launcher).toHaveCount(0);
  }
});
```

Run: `npm run e2e -- chat`
Expected: 1 passed (asserts absence when the flag is unset, which is the default dev state).

- [ ] **Step 9: Verify parity, build, commit**

Run: `node -e "const a=require('./messages/en.json'),b=require('./messages/es.json');const k=o=>Object.entries(o).flatMap(([n,v])=>Object.keys(v).map(x=>n+'.'+x)).sort();console.log('equal',JSON.stringify(k(a))===JSON.stringify(k(b)));"` → `equal true`.
Run: `npm test` → all pass. `npm run build` → succeeds. `npm run lint` → clean.

```bash
git add -A
git -c user.name="Dan Lopez" -c user.email="danlopez508@gmail.com" commit -m "feat: floating bilingual ChatWidget mounted site-wide behind enable flag"
```

---

## Self-review notes (addressed)
- **Spec coverage:** DeepSeek concierge (Task 2), system prompt with BIS facts + rules (Task 1), `capture_lead` reusing Phase 2 with never-lose semantics (Tasks 1-2), floating bilingual widget gated on the flag (Task 3), cost caps (maxOutputTokens + message cap + rate limit, Task 2), no RAG/transcripts (nothing added).
- **No live LLM/DB in tests:** system prompt + capture-lead + rate-limit are pure/faked; the widget mocks `useChat`; the route is not unit-tested against a live model (its logic — caps, tool wiring — is transcription verified by build; a model-mock route test can be added if desired).
- **Type consistency:** `buildSystemPrompt`, `captureLeadSchema`/`CaptureLeadArgs`/`processCapturedLead`/`CaptureDeps`, `rateLimit` are defined in Tasks 1-2 and consumed with matching signatures in Task 2's route.
- **AI SDK version risk:** explicitly called out — implementer verifies the installed `ai`/`@ai-sdk/react`/`@ai-sdk/deepseek` API before writing the route/widget.
- **Placeholder note:** `DEEPSEEK_API_KEY` + `NEXT_PUBLIC_AI_ENABLED` are documented owner-provided config, not plan gaps.

## Post-implementation (owner actions, not code)
- Create a **DeepSeek** account + API key.
- Set in Vercel (Production): `DEEPSEEK_API_KEY` and `NEXT_PUBLIC_AI_ENABLED=true`; redeploy.
- Test the live widget: ask a question, then go through the lead-capture flow and confirm a `[via AI assistant]` row lands in Neon + the notification email arrives.
- Optional hardening: add Upstash rate limiting.
