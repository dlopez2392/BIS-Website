import { z } from 'zod';
import type { UIMessage } from 'ai';
import type { ContactFormValues } from '@/lib/contact-schema';

export const bookAssessmentSchema = z.object({
  startsAt: z.string().min(1),
  fullName: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});
export type BookAssessmentArgs = z.infer<typeof bookAssessmentSchema>;

export interface BookingContext {
  ip: string;
  timeZone: string;
  language: 'en' | 'es';
}

export interface BookingDeps {
  book(input: {
    startsAt: string;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
    timeZone: string;
    language: 'en' | 'es';
  }): Promise<{ uid: string; startsAt: string }>;
  allowBooking(ip: string): Promise<{ ok: boolean; reason?: string }>;
  insertLead: (v: ContactFormValues) => Promise<{ id: string }>;
  sendLeadNotification: (v: ContactFormValues) => Promise<void>;
}

export type BookingResult =
  | { ok: true; uid: string; startsAt: string }
  | { ok: false; error: string };

/**
 * True once this conversation already produced a booking.
 *
 * The chat is anonymous and unauthenticated, so the only per-visitor identity
 * we can trust is the conversation itself. This is the guard that does not
 * depend on Redis being up, which is what makes failing open on the daily caps
 * defensible.
 */
export function alreadyBookedInConversation(messages: UIMessage[]): boolean {
  return messages.some((message) =>
    (message.parts ?? []).some((part) => {
      const p = part as { type?: string; output?: unknown };
      if (p.type !== 'tool-book_assessment') return false;
      return (p.output as { ok?: boolean } | undefined)?.ok === true;
    }),
  );
}

/**
 * Books, then records the lead. Returns a failure the model can act on rather
 * than throwing, because the prompt's fallback — paste the booking link — is a
 * better outcome for the visitor than an error bubbling into the stream.
 */
export async function runBookAssessment(
  args: BookAssessmentArgs,
  ctx: BookingContext,
  deps: BookingDeps,
  opts: { alreadyBooked: boolean },
): Promise<BookingResult> {
  if (opts.alreadyBooked) {
    return {
      ok: false,
      error: 'This conversation already has a booking. Share the booking link if they want another time.',
    };
  }

  const allowed = await deps.allowBooking(ctx.ip);
  if (!allowed.ok) {
    return {
      ok: false,
      error: 'Booking is temporarily unavailable. Share the booking link so they can pick a time directly.',
    };
  }

  let booked: { uid: string; startsAt: string };
  try {
    booked = await deps.book({
      startsAt: args.startsAt,
      name: args.fullName,
      email: args.email,
      phone: args.phone,
      notes: args.notes,
      timeZone: ctx.timeZone,
      language: ctx.language,
    });
  } catch (err) {
    console.error('[assistant] booking failed', err);
    return {
      ok: false,
      error: `That time could not be booked (${(err as Error).message}). Offer another time or share the booking link.`,
    };
  }

  // The booking succeeded, so from here nothing may report failure to the
  // visitor. A booking that leaves no lead is an invisible calendar event —
  // the exact defect the phone channel shipped, where booked calls landed in
  // the shared leads table as "Unknown caller".
  const lead: ContactFormValues = {
    fullName: args.fullName,
    businessName: '',
    email: args.email,
    phone: args.phone ?? '',
    industry: 'other',
    language: ctx.language,
    message: `[via AI assistant · booked ${booked.startsAt}] ${args.notes ?? 'Free assessment booked from the website chat.'}`,
  };
  try {
    await deps.insertLead(lead);
  } catch (err) {
    console.error('[assistant] booking saved on Cal but lead insert failed', err);
  }
  try {
    await deps.sendLeadNotification(lead);
  } catch (err) {
    console.error('[assistant] booking saved on Cal but notification failed', err);
  }

  return { ok: true, uid: booked.uid, startsAt: booked.startsAt };
}
