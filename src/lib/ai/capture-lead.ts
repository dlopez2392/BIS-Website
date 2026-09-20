import { z } from 'zod';
import type { ContactFormValues } from '@/lib/contact-schema';
import type { ReportInput } from '@/lib/observability/report';
import type { IntakeResult, PlatformLead } from '@/lib/platform-intake';

/**
 * What the assistant must have before it may save a lead — the same five
 * things the contact form requires, because the lead goes to the same place.
 */
export const captureLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().default(''),
  businessName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(7),
  need: z.string().min(1),
  language: z.enum(['en', 'es']),
});
export type CaptureLeadArgs = z.infer<typeof captureLeadSchema>;

export interface CaptureDeps {
  /** The CRM. Throws when the platform is unreachable or unconfigured. */
  submitToPlatform: (lead: PlatformLead) => Promise<IntakeResult>;
  /** The legacy store, kept as the fallback so a platform outage never loses a lead. */
  insertLead: (v: ContactFormValues) => Promise<{ id: string }>;
  sendLeadNotification: (v: ContactFormValues) => Promise<void>;
  /** Where failures go. See src/lib/observability/report.ts. */
  report: (input: ReportInput) => Promise<void>;
}

const SAVED = 'Saved. Our team will follow up shortly.';

export async function processCapturedLead(
  args: CaptureLeadArgs,
  deps: CaptureDeps,
): Promise<{ ok: boolean; message: string }> {
  // First choice: the CRM, where a contact, a thread and an unread badge are
  // waiting for it, exactly as if the person had used the contact form.
  try {
    await deps.submitToPlatform({
      locale: args.language,
      firstName: args.firstName,
      lastName: args.lastName,
      businessName: args.businessName,
      email: args.email,
      phone: args.phone,
      need: args.need,
    });
    return { ok: true, message: SAVED };
  } catch (err) {
    // Recoverable, because the fallback below still saves it — but it is a
    // lead the CRM did not see, and someone should know the platform said no.
    await deps.report({
      event: 'lead.platform_intake_failed',
      level: 'error',
      error: err,
      context: { source: 'assistant', email: args.email },
    });
  }

  const lead: ContactFormValues = {
    fullName: `${args.firstName} ${args.lastName}`.trim(),
    businessName: args.businessName,
    email: args.email,
    phone: args.phone,
    industry: 'other',
    language: args.language,
    message: `[via AI assistant] ${args.need}`,
  };
  try {
    await deps.insertLead(lead);
  } catch (err) {
    // A person typed their details into the assistant and both stores refused
    // them. That is a lost customer unless someone is told, so the alert
    // carries everything needed to answer them by hand.
    await deps.report({
      event: 'lead.insert_failed',
      level: 'critical',
      error: err,
      context: { source: 'assistant', email: lead.email },
      recovery: { Name: lead.fullName, Business: lead.businessName, Email: lead.email, Phone: lead.phone, Language: lead.language, Need: args.need },
    });
    return { ok: false, message: 'Sorry — something went wrong saving your details. Please email us instead.' };
  }
  try {
    await deps.sendLeadNotification(lead);
  } catch (err) {
    // The lead is safe in the fallback store; only the heads-up email failed.
    await deps.report({ event: 'lead.notify_failed', level: 'error', error: err, context: { source: 'assistant' } });
  }
  return { ok: true, message: SAVED };
}
