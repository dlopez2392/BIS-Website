# Contact form and scheduler on the BIS Platform — 2026-09-03

## Why

The site sells a client platform whose first features are a hosted lead form
and a booking page. Until now the agency's own site used neither: the contact
form posted to a Neon table through Resend, and the scheduler was a Cal.com
embed. Two vendors held copies of every prospect, and the product's own proof
point was missing from the one site every prospect visits.

Both are now framed from the BIS Platform (`app.bis-rgv.com`), so every lead
lands in the same CRM, conversation thread and calendar a customer's would.

## What changed

| Surface | Before | After |
|---|---|---|
| `/contact` form | `ContactForm` → server action → Neon `leads` + Resend (notify + thank-you) | `PlatformEmbed kind="form"` → platform `/f/<id>` (one form per language) |
| `/contact` scheduler | `@calcom/embed-react` | `PlatformEmbed kind="booking"` → platform `/b/<id>?locale=` |
| Chat assistant booking | Cal.com API tools (`check_availability`, `book_assessment`) with Upstash daily caps | Shares the platform booking link; `capture_lead` unchanged (still Neon + Resend) |
| Analytics | `lead_submitted` from the native form | `lead_submitted` / `assessment_booked` from the platform's `bis-*-submitted` postMessage |
| Privacy processors | Cal.com listed | BIS Platform listed; Neon/Resend wording narrowed to what they still do |

Removed: `src/lib/cal.ts`, `src/lib/ai/booking.ts`, `src/lib/contact/process.ts`,
the contact server action, `ThankYou` email, `allowBooking` limits, the chat's
`timeZone` plumbing, the `@calcom/embed-react` dependency.

Kept: `contact-schema.ts` (the chat's captured-lead shape), `contact/repository.ts`,
`sendLeadNotification`, `LeadNotification` — the chat assistant still writes a
captured lead to Neon and notifies the inbox.

## Contract with the platform

`src/lib/platform.ts` mirrors the platform's `GET /embed.js`: same URL shape
(`?locale=`, `?theme=`, lifted `utm_*`/`gclid`/`fbclid`, `page`, `ref`) and
the same postMessage protocol (`bis-form-height`, `bis-form-redirect`,
`bis-form-submitted`, `bis-booking-submitted`). The listener checks
`event.source` and `event.origin` before trusting anything.

The platform side shipped `?theme=` (host colour-mode hint), `?locale=` on
`/b`, and the two `*-submitted` messages in the same change set; the website
degrades gracefully against an older platform (light-on-dark form, English
scheduler, no conversion event) but does not break.

## Env

All optional, defaults are the live BIS account: `NEXT_PUBLIC_BIS_PLATFORM_ORIGIN`,
`NEXT_PUBLIC_BIS_FORM_ID_EN`, `NEXT_PUBLIC_BIS_FORM_ID_ES`, `NEXT_PUBLIC_BIS_BOOKING_ID`.
Deleted from Vercel on 2026-09-03 now that nothing reads them:
`NEXT_PUBLIC_CALCOM_LINK`, `CAL_API_KEY`, `CAL_USERNAME`, `CAL_EVENT_SLUG`.
The Cal.com API key itself should also be revoked in the Cal.com dashboard.

## Follow-ups

- Platform: a public booking API so the chat assistant can book in-conversation
  again (it did through Cal.com; the platform only exposes server actions).
- Platform (shipped alongside): every form now sends the submitter a receipt in
  the page's language, and a Spanish booker gets a Spanish confirmation and
  cancel page. Still English: the booking reminder (the row carries no booker
  language yet).
- Chat `capture_lead` still writes to Neon; the platform should own that too
  once it has a public contact-intake endpoint.
- The site's published line was `(956) 705-5146`, which the platform holds
  under a different account from the booking calendar. It now publishes
  `(956) 506-1545`, the BIS account's own line, so Sofía and the contact page
  share one account. The old line stays on Test Client One.
