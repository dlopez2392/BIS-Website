# Chat Booking — Design & Plan

**Date:** 2026-08-08 · **Approved by:** danlo (design + the Upstash decision)
**Repo:** BIS-Website · branch `feat/chat-booking` off `main` @ 297e8a5

## Goal

The site assistant can book the Free Assessment itself. Today it captures a lead, pastes a cal.com link, and hopes the visitor clicks through, lands on Cal, and fills a form. Closing that loop is the largest remaining conversion gain on the site, and it makes the grounding work convert rather than merely inform.

## Decisions

| Question | Decision |
|---|---|
| Share code with the reception repo? | **No — port a minimal client.** Precedent is already in that repo: the notification HTTP call was duplicated deliberately ("one HTTP call is cheaper to duplicate than to couple"). Two independent deploys; sharing would mean a monorepo migration for two endpoints. |
| Cal API versions | Carry the **live-verified pins**: slots `2024-09-04`, bookings `2026-02-25`. Cal v2 versions differ per endpoint and the official agents guide is stale — do not "modernise" these. |
| Abuse control | **Upstash now** (danlo reversed his deferral for this specifically: a stranger writing to his calendar is a different risk class from a stranger costing a penny). Reuses the existing `upstash-kv-citron-paddle` store, already connected to this project. |
| Key namespace | All website keys prefixed **`web:`** — the store is shared with Sofía, whose keys are `session:*` / `calls:*`. |
| Redis unavailable | **Fail open**, log loudly. Matches Sofía's call caps and the never-lose-a-lead rule. The real guards are one-booking-per-conversation plus a required email. |
| Reschedule / cancel | **Out of scope.** Cal's own confirmation email handles both. |

## Env

Already set: `CAL_USERNAME=dan-lopez-utygjo`, `CAL_EVENT_SLUG=free-assessment`, and `KV_REST_API_URL` / `KV_REST_API_TOKEN` injected by connecting the Upstash store.
**Owner action:** `CAL_API_KEY` (Sensitive) in Vercel Production. Without it the booking tools must degrade, not crash — see Task 4.

## Tasks

### Task 1 — Shared-state limits (`src/lib/limits.ts`)

Replaces the in-process `src/lib/ai/rate-limit.ts`, whose `Map` gives each lambda instance its own counter, so "10/min" was really "10/min per instance until it forgets."

- `allowChat(ip): Promise<boolean>` — 10 per 60s, key `web:rl:chat:<ip>`.
- `allowBooking(ip): Promise<{ ok: boolean; reason?: 'ip-daily' | 'global-daily' }>` — 2 per IP per day (`web:rl:book:ip:<ip>:<yyyy-mm-dd>`) and 20 per day overall (`web:rl:book:day:<yyyy-mm-dd>`).
- Redis via `@upstash/redis`, reading `UPSTASH_REDIS_REST_URL ?? KV_REST_API_URL` (and matching token) — the same dual-name lookup Sofía uses, because the Marketplace integration injects `KV_REST_API_*` while a direct Upstash project injects `UPSTASH_*`.
- No Redis configured → in-process fallback, which is correct for local dev and tests.
- **Tests:** counting and expiry against a fake Redis; fallback path; fail-open on a throwing Redis; keys carry the `web:` prefix; per-IP and global caps are independent.

### Task 2 — Cal client (`src/lib/cal.ts`)

- `listSlots({ date, timeZone }): Promise<string[]>` — ISO starts.
- `book({ startsAt, name, email, phone?, notes?, timeZone, language }): Promise<{ uid: string; startsAt: string }>`.
- `fetch` injected for tests; timeout; a typed `CalError` that keeps the response detail. Port the reception repo's 404 hint — a 404 there almost always means a wrong `cal-api-version`, not a missing route.
- **Tests:** version headers per endpoint; slot parsing; error surfaces detail; timeout; no key configured throws a distinguishable error.

### Task 3 — Timezone from the visitor

`ChatWidget` already sends `locale` and `path`; add `timeZone` from `Intl.DateTimeFormat().resolvedOptions().timeZone`. Validated server-side in `visitor-context.ts` (must be a string Intl accepts), falling back to `America/Chicago`. Without this, "tomorrow at 2" silently means Dan's 2 o'clock, not the visitor's.

- **Tests:** valid zone passes; junk and over-long values fall back; the fallback is the business timezone.

### Task 4 — Tools and prompt rules (`src/app/api/chat/route.ts`, `src/lib/ai/system-prompt.ts`)

- `check_availability(date)` → two or three ISO starts.
- `book_assessment(startsAt, name, email, phone?, notes?)` → books, then **writes a lead** through the existing lazy-imported `insertLead` / `sendLeadNotification` path. This applies the lesson the phone side taught this week: a booking that leaves no lead becomes an invisible calendar event (phone bookings were landing as "Unknown caller").
- **One booking per conversation:** refuse if the incoming message history already contains a successful `book_assessment` result.
- **Degrade, never crash:** if `CAL_API_KEY` is missing or Cal errors, the tool returns a failure the model can act on, and the prompt tells it to fall back to pasting the booking link — today's behaviour.
- Prompt rules mirroring Sofía, whose phrasing is already proven on real calls: offer concrete times with weekdays, never claim something is booked without a successful tool result, collect name and email (phone optional), and after success restate the weekday and time and mention the confirmation email.

### Task 5 — Verification

- Gate: `tsc --noEmit`, lint, unit serial, build, `npx playwright test --workers=1`, and CI green on the branch.
- A `CAL_LIVE_TEST=1` opt-in test that calls **`listSlots` only** — proves the API key and version pins against the real Cal without putting junk on the calendar. Booking is verified by danlo making one real chat booking after deploy, which he can then cancel.

## Out of scope

Reschedule and cancel · booking from the phone channel (already done) · any change to Sofía · the `/work` case-study page (that is the separate "make Sofía the proof" item).
