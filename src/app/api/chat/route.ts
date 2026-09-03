import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { captureLeadSchema, processCapturedLead } from '@/lib/ai/capture-lead';
import { getLimits } from '@/lib/limits';
import { resolveVisitorContext } from '@/lib/ai/visitor-context';
import { getSiteContext } from '@/lib/ai/site-context';
import { publicPageUrl } from '@/lib/platform';

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
      // The platform's hosted scheduler, the same one the contact page frames.
      // The assistant used to book directly through Cal.com's API; the
      // platform has no public booking API yet, so the assistant hands the
      // visitor the page instead. Per-locale, like the rest of the prompt.
      bookingLink: publicPageUrl('booking', visitor.locale),
      siteContext,
      locale: visitor.locale,
      path: visitor.path,
    }),
    messages: await convertToModelMessages(messages),
    temperature: 0.4,
    maxOutputTokens: 700,
    // Without this the model stops the moment a tool returns, so a visitor sees
    // "Saving your details" and nothing else — observed in prod on the first
    // live probe. Four steps covers capture_lead -> speak with room to spare,
    // and bounds the cost of a runaway loop.
    stopWhen: stepCountIs(4),
    tools: {
      capture_lead: tool({
        description: "Save a qualified lead's name, email, and need. Call once you have all three.",
        inputSchema: captureLeadSchema,
        execute: async (args) => captureLead(args),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
