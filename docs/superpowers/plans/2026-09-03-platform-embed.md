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
Now unused and safe to delete from Vercel: `NEXT_PUBLIC_CALCOM_LINK`, `CAL_API_KEY`,
`CAL_USERNAME`, `CAL_EVENT_SLUG`.

## Follow-ups

- Platform: a public booking API so the chat assistant can book in-conversation
  again (it did through Cal.com; the platform only exposes server actions).
- Platform: a submitter confirmation email on form submit (Resend thank-you was
  dropped with the native form) and Spanish confirmation/reminder emails.
- Chat `capture_lead` still writes to Neon; the platform should own that too
  once it has a public contact-intake endpoint.
- Sofía's line (`+1 956 705 5146`) sits on a different platform account from
  the site's booking calendar; the case-study copy no longer claims they share
  a calendar.
