import { after } from 'next/server';
import { checkBotId } from 'botid/server';
import { verifyHuman } from '@/lib/security/verify-human';
import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { captureLeadSchema, processCapturedLead } from '@/lib/ai/capture-lead';
import { getLimits } from '@/lib/limits';
import { resolveVisitorContext } from '@/lib/ai/visitor-context';
import { getSiteContext } from '@/lib/ai/site-context';
import { publicPageUrl } from '@/lib/platform';
import { report } from '@/lib/observability/reporter';

// Lazy-imported inside execute() so the route module stays import-safe at
// build-time page-data collection: '@/db' calls neon() at module load and
// throws without DATABASE_URL. execute() only runs at request time.
async function captureLead(args: Parameters<typeof processCapturedLead>[0]) {
  const [{ insertLead }, { sendLeadNotification }, { report }] = await Promise.all([
    import('@/lib/contact/repository'),
    import('@/lib/email/resend'),
    import('@/lib/observability/reporter'),
  ]);
  return processCapturedLead(args, { insertLead, sendLeadNotification, report });
}

export const maxDuration = 30;
const MAX_MESSAGES = 20;

// Module-level so a broken pack logs once per instance instead of once per request.
let packFailureLogged = false;
function logPackFailure(err: unknown) {
  if (packFailureLogged) return;
  packFailureLogged = true;
  // `after` rather than a floating promise: on Vercel the function can be
  // frozen the moment the response finishes, which would drop the very report
  // that explains why the response was degraded.
  after(() => report({ event: 'chat.context_unavailable', level: 'error', error: err }));
}

export async function POST(req: Request) {
  // Bot check before the rate limiter: a script that never reaches the model
  // costs nothing, and a blocked script should not consume a real visitor's
  // share of the per-IP window. Verified crawlers are let through on purpose —
  // robots.txt invites answer engines, and the policy should not contradict
  // itself one layer down.
  const { allowed } = await verifyHuman({ check: checkBotId, report });
  if (!allowed) {
    after(() => report({ event: 'chat.bot_blocked', level: 'error', context: { path: req.headers.get('referer') ?? 'unknown' } }));
    return new Response('Access denied', { status: 403 });
  }

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

  return result.toUIMessageStreamResponse({
    // A model provider that times out or rejects the key used to surface as an
    // unhandled framework 500 with nothing recorded. The visitor still sees a
    // failure, but now it is a sentence in their own language and the failure
    // is on the record.
    onError: (error) => {
      after(() => report({ event: 'chat.stream_failed', level: 'error', error, context: { locale: visitor.locale, path: visitor.path } }));
      return visitor.locale === 'es'
        ? 'Perdona, el asistente no está disponible en este momento. Escríbenos o llámanos y te atendemos.'
        : 'Sorry — the assistant is unavailable right now. Send us a message or call and we will help.';
    },
  });
}
