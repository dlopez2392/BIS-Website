# Bilingual AI Assistant — Design Spec

**Date:** 2026-07-09
**Status:** Approved (pending spec review)
**Repo:** https://github.com/dlopez2392/BIS-Website (live: https://bis-rgv.com)
**Context:** Improvement sub-project #4 (roadmap, the largest). A bilingual, lead-qualifying AI chat assistant — an on-brand differentiator for an "Intelligent Solutions" firm that also captures leads into the existing Phase 2 pipeline.

## Goal

Give visitors an always-available, bilingual concierge that answers questions about BIS, qualifies interest, captures the lead (name/email/need) into the same pipeline as the contact form, and points them to booking — increasing conversions and demonstrating BIS's own AI capability.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Assistant role | **Lead-qualifying concierge** (not a general Q&A or RAG bot) |
| LLM provider | **DeepSeek** via Vercel AI SDK (`@ai-sdk/deepseek`, model `deepseek-chat`) |
| UI | **Floating chat bubble on all pages** (bottom-right), bilingual + theme-matched |
| Lead capture | **`capture_lead` tool** → reuses the Phase 2 pipeline (Neon insert + notification email), then shares the Cal.com booking link |
| Knowledge | System prompt seeded with BIS facts — **no RAG** (YAGNI) |
| Persistence | Only *captured leads* persist (via the tool). **No chat-transcript storage.** |

## Architecture

- **Client:** `ChatWidget` (floating bubble → chat panel) mounted in `src/app/[locale]/layout.tsx`, using the Vercel AI SDK `useChat` (`@ai-sdk/react`). Bilingual UI copy (EN/ES) from a new `chat` next-intl namespace; theme-matched. **Gated on `NEXT_PUBLIC_AI_ENABLED`** (or the widget checks a public flag) so it stays hidden until DeepSeek is configured — nothing breaks pre-setup.
- **Server:** `POST /api/chat` runs `streamText` with DeepSeek (`deepseek-chat`), a system prompt, and the `capture_lead` tool. Streams the response.
- **System prompt** (`src/lib/ai/system-prompt.ts`): seeds BIS facts (name, founder Dan Lopez, area served RGV, the 3 services, 5 industries, contact email, Cal.com booking link) and the behavior rules: stay on-topic (BIS IT/AI consulting for the RGV); reply in the visitor's language (EN/ES); concise + professional; NEVER invent pricing, timelines, or commitments; decline off-topic and legal/medical/financial advice; when the visitor shows buying intent, gather name + email + a one-line need and call `capture_lead`, then offer the booking link.
- **`capture_lead` tool** (`src/lib/ai/capture-lead.ts`): args `{ fullName, email, need, language }`. Reuses Phase 2 `insertLead` + `sendLeadNotification` with a lead row: `fullName`, `email`, `businessName=''`, `phone=''`, `industry='other'`, `language`, `message='[via AI assistant] ' + need`. No DB schema change. Returns a confirmation string; the assistant then shares the Cal.com link.

## Guardrails & cost control (public LLM endpoint)

- `streamText` with a **capped `maxOutputTokens`** (e.g. 500) and a low temperature.
- **Per-conversation message cap** enforced both client-side (stop accepting input) and server-side (reject requests whose message array exceeds the cap) — bounds cost per session.
- **Basic per-IP rate limit** on `/api/chat` (lightweight; e.g. an in-process/token-bucket guard) returning 429 when exceeded.
- Fast-follow (not v1): **Upstash Redis rate limiting** (`@upstash/ratelimit`, Vercel Marketplace free tier) for durable cross-instance limits — flagged, not built now.
- The system prompt's scope + refusal rules are the content guardrail; no user input reaches a shell/DB except through the validated `capture_lead` tool (same zod-validated shape as the form's email field).

## Env

- `DEEPSEEK_API_KEY` (Dan provides; server-only). Reuses existing `DATABASE_URL`, `RESEND_API_KEY`, `CONTACT_NOTIFY_TO`.
- `NEXT_PUBLIC_AI_ENABLED` (or equivalent public flag) gates the widget's visibility.

## Testing

- Unit: `capture_lead` handler maps args → the correct lead row and calls `insertLead` + `sendLeadNotification` (fakes; no live DB/email/LLM); invalid email → rejected.
- Unit: system-prompt builder includes key BIS facts (services, RGV, booking link) and the language/scope rules.
- Route: `/api/chat` wires `streamText` with the system prompt + `capture_lead` tool and enforces the message cap / rate limit (model mocked — no live LLM call in tests).
- Component: `ChatWidget` renders the bubble and opens the panel; hidden when the enable-flag is off.
- e2e: the bubble appears on a page (when enabled) and the panel opens. (Live LLM streaming is NOT e2e'd.)
- EN/ES key parity for new `chat` copy.

## Out of scope (YAGNI / later)

- RAG/knowledge base, chat-transcript storage/history, voice, multi-agent, human handoff, Upstash rate limiting (fast-follow), analytics beyond the existing `lead_submitted` (a separate `assistant_lead` event could be added later).

## Owner setup (Dan's action — not code)

- Create a **DeepSeek** account + API key → we set `DEEPSEEK_API_KEY` + enable the flag in Vercel, then deploy. Build ships with the widget gated off until then.
