import { streamText, tool, convertToModelMessages, type UIMessage } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { captureLeadSchema, processCapturedLead } from '@/lib/ai/capture-lead';
import { rateLimit } from '@/lib/ai/rate-limit';

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
    messages: await convertToModelMessages(messages),
    temperature: 0.4,
    maxOutputTokens: 500,
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
