# Calendar Booking — Design Spec

**Date:** 2026-07-09
**Status:** Approved (pending spec review)
**Repo:** https://github.com/dlopez2392/BIS-Website (live: https://bis-rgv.com)
**Context:** Improvement sub-project #3 (roadmap). Adds Cal.com self-scheduling on the Contact page so hot prospects can book the free assessment call directly, alongside the existing lead form. Standalone; independent of #4 (AI assistant).

## Goal

Reduce friction on the "Book your assessment" money path: let a ready prospect self-book a call in seconds, without waiting on an email reply — while keeping the form for those who prefer to write.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Provider | **Cal.com** (open-source, free tier, React embed, owned data) |
| Placement | **On `/contact`, below the existing form** — a "Prefer to talk? Book a call" section with the inline Cal.com scheduler |
| Booking data | Cal.com owns the calendar/confirmations — **NOT** stored in our Neon DB (YAGNI) |

## Design

- **Component `BookingEmbed`** (client) at `src/components/contact/BookingEmbed.tsx`, using `@calcom/embed-react`:
  - Renders the inline Cal.com scheduler for the booking link in env `NEXT_PUBLIC_CALCOM_LINK` (e.g. `dan-lopez/assessment`).
  - **Bilingual + theme-aware:** passes the page locale (from `useLocale()`, en/es) and the current light/dark theme (from `next-themes`) to the embed config so it matches the site.
  - **Graceful fallback:** always renders a plain anchor to `https://cal.com/${NEXT_PUBLIC_CALCOM_LINK}` so booking works even if the embed script fails to load (and gives tests a deterministic assertion target).
- **Contact page** (`src/app/[locale]/contact/page.tsx`): add a section BELOW the form — heading + subtext + `<BookingEmbed/>`. New copy in the `contact` next-intl namespace (EN + ES, identical keys): `bookHeading`, `bookSubtext`, `bookFallback` (the fallback link text).
- **Env:** `NEXT_PUBLIC_CALCOM_LINK` — set in Vercel once Dan creates the Cal.com event; a documented placeholder default in dev so the build/tests run without it.

## Owner setup (Dan's action — not code)

Create a Cal.com account → a "Free Assessment" event type (e.g. 20-min call) → connect his calendar → provide the booking link (`username/event-slug`). We then set `NEXT_PUBLIC_CALCOM_LINK` in Vercel.

## Testing

- Component test: `BookingEmbed` renders the fallback anchor with `href` pointing at the configured booking link, and the embed init (`getCalApi`/`useEffect`) is guarded so it does not throw in jsdom (no live script load in tests).
- e2e: `/contact` shows the "Book a call" section heading (EN); the fallback booking link is present. The live Cal iframe (external) is NOT e2e'd.
- EN/ES key parity preserved for the new `contact` keys.

## Out of scope (YAGNI / later)

- Custom availability logic, storing bookings in Neon, booking analytics beyond the existing `lead_submitted` event, reminders (Cal.com handles confirmations/reminders), a dedicated `/book` page or popup-modal variant.

## Open items before launch

- Dan's Cal.com booking link → set `NEXT_PUBLIC_CALCOM_LINK` in Vercel (build ships a placeholder until then).
