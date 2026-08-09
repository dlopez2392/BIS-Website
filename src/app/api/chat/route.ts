import { streamText, tool, convertToModelMessages, type UIMessage } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { captureLeadSchema, processCapturedLead } from '@/lib/ai/capture-lead';
import { z } from 'zod';
import { getLimits } from '@/lib/limits';
import { calConfigFromEnv, listSlots, book } from '@/lib/cal';
import { bookAssessmentSchema, runBookAssessment, alreadyBookedInConversation } from '@/lib/ai/booking';
import { resolveVisitorContext } from '@/lib/ai/visitor-context';
import { getSiteContext } from '@/lib/ai/site-context';

// Lazy-imported inside execute() so the route module stays import-safe at
// build-time page-data collection: '@/db' calls neon() at module load and
// throws without DATABASE_URL. execute() only runs at request time.
async function captureLead(args: Parameters<typeof processCapturedLead>[0]) {
  const [{ insertLead }, { sendLeadNotification }] = await Promise.all([
    import('@/lib/contact/repository'),
    import('@/lib/email/resend'),
  ]);
  return processCapturedLead(args, { insertLead, sendLeadNotification });
}

export const maxDuration = 30;
const MAX_MESSAGES = 20;
const BOOKING_LINK = `https://cal.com/${process.env.NEXT_PUBLIC_CALCOM_LINK ?? 'dan-lopez-utygjo/free-assessment'}`;

// Module-level so a broken pack logs once per instance instead of once per request.
let packFailureLogged = false;
function logPackFailure(err: unknown) {
  if (packFailureLogged) return;
  packFailureLogged = true;
  console.error('[chat] site context unavailable, falling back to ungrounded prompt', err);
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limits = await getLimits();
  if (!(await limits.allowChat(ip))) return new Response('Too many requests', { status: 429 });

  // A malformed body must be the route's own 400, not an unhandled throw that
  // surfaces as a framework 500 — the body is attacker-controlled.
  let payload: { messages?: UIMessage[]; locale?: unknown; path?: unknown };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const messages = payload?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return new Response('Bad request', { status: 400 });
  }

  // `ai@7.0.22`'s standardizePrompt defaults allowSystemInMessages to false,
  // which already rejects a client-supplied role:'system' message — but that
  // is an SDK default we don't control, not a guarantee. Reject it explicitly
  // here for the same reason path validation is explicit: a crafted request
  // must never get to inject prompt content the app didn't put there.
  if (messages.some((message) => (message as { role?: unknown }).role === 'system')) {
    return new Response('Bad request', { status: 400 });
  }

  const visitor = resolveVisitorContext(payload);

  // Grounding is best-effort: if the pack cannot be built the assistant falls
  // back to the ungrounded prompt rather than failing the request.
  let siteContext: string | undefined;
  try {
    siteContext = await getSiteContext(visitor.locale);
  } catch (err) {
    logPackFailure(err);
  }

  const result = streamText({
    model: deepseek('deepseek-chat'),
    system: buildSystemPrompt({
      bookingLink: BOOKING_LINK,
      siteContext,
      locale: visitor.locale,
      path: visitor.path,
    }),
    messages: await convertToModelMessages(messages),
    temperature: 0.4,
    maxOutputTokens: 700,
    tools: {
      capture_lead: tool({
        description: "Save a qualified lead's name, email, and need. Call once you have all three.",
        inputSchema: captureLeadSchema,
        execute: async (args) => captureLead(args),
      }),

      check_availability: tool({
        description:
          'Free-assessment start times for one date (YYYY-MM-DD), in the visitor timezone. Call before offering any time.',
        inputSchema: z.object({ date: z.string().min(1) }),
        execute: async ({ date }) => {
          try {
            const slots = await listSlots(calConfigFromEnv(), { date, timeZone: visitor.timeZone });
            // A handful is plenty to offer aloud; the full list is noise in context.
            return { ok: true, timeZone: visitor.timeZone, slots: slots.slice(0, 6) };
          } catch (err) {
            console.error('[chat] check_availability failed', err);
            return { ok: false, error: 'Availability is unavailable right now. Share the booking link instead.' };
          }
        },
      }),

      book_assessment: tool({
        description:
          'Book the free assessment at a start time returned by check_availability. Needs full name and email.',
        inputSchema: bookAssessmentSchema,
        execute: async (args) => {
          // Lazily imported for the same reason as the lead helpers below: '@/db'
          // calls neon() at module load and the route is evaluated at build time.
          const [{ insertLead }, { sendLeadNotification }] = await Promise.all([
            import('@/lib/contact/repository'),
            import('@/lib/email/resend'),
          ]);
          return runBookAssessment(
            args,
            { ip, timeZone: visitor.timeZone, language: visitor.locale },
            {
              book: (input) => book(calConfigFromEnv(), input),
              allowBooking: (forIp) => limits.allowBooking(forIp),
              insertLead,
              sendLeadNotification,
            },
            { alreadyBooked: alreadyBookedInConversation(messages) },
          );
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
