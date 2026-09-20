import { FORM_PUBLIC_IDS, PLATFORM_ORIGIN, type Locale } from '@/lib/platform';

/**
 * A lead the assistant captured, on its way into the CRM.
 *
 * The contact form on /contact is the platform's own form, embedded, so a
 * lead typed there lands in the BIS Platform as a contact, a conversation
 * thread and an unread badge. A lead the assistant captured used to land in
 * this site's legacy `leads` table and an email instead — invisible to the
 * pipeline, to Sofía, and to the Monday report. This posts it to the
 * platform's machine intake (`POST /api/intake/<form publicId>`), which runs
 * the same pipeline the form does after its browser-only guards.
 *
 * `LEAD_INTAKE_SECRET` is the same value as the platform's; unset here or
 * there, this throws and the caller falls back to the legacy store, so a
 * misconfiguration costs the CRM row but never the lead.
 */
export interface PlatformLead {
  locale: Locale;
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
  /** What they said they need, in their words. */
  need: string;
}

export interface IntakeResult { ok: true; submissionId?: string; duplicate?: boolean }

export class PlatformIntakeError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'PlatformIntakeError';
  }
}

export const INTAKE_TIMEOUT_MS = 8000;
export const INTAKE_SOURCE = 'bis-rgv.com assistant';

export function intakeUrl(locale: Locale): string {
  return `${PLATFORM_ORIGIN}/api/intake/${encodeURIComponent(FORM_PUBLIC_IDS[locale])}`;
}

/** The request body, shaped to the BIS contact form's field keys. */
export function intakeBody(lead: PlatformLead) {
  return {
    locale: lead.locale,
    source: INTAKE_SOURCE,
    attribution: { utm_source: 'bis-rgv.com', utm_medium: 'ai-assistant' },
    answers: {
      first_name: lead.firstName,
      last_name: lead.lastName,
      company_name: lead.businessName,
      email: lead.email,
      phone: lead.phone,
      message: `[via AI assistant] ${lead.need}`,
    },
  };
}

export async function submitLeadToPlatform(
  lead: PlatformLead,
  fetchImpl: typeof fetch = fetch,
): Promise<IntakeResult> {
  const secret = process.env.LEAD_INTAKE_SECRET;
  if (!secret) throw new PlatformIntakeError('LEAD_INTAKE_SECRET is not set');
  const res = await fetchImpl(intakeUrl(lead.locale), {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
    body: JSON.stringify(intakeBody(lead)),
    signal: AbortSignal.timeout(INTAKE_TIMEOUT_MS),
  });
  if (!res.ok) throw new PlatformIntakeError(`platform intake answered ${res.status}`, res.status);
  return (await res.json()) as IntakeResult;
}
