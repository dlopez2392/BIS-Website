import { Resend } from 'resend';
import { LeadNotification } from '@/emails/LeadNotification';
import { ResourceEmail } from '@/emails/ResourceEmail';
import { resourceSubject } from '@/emails/messages';
import { getResource } from '@/lib/resources';
import { SITE_URL } from '@/lib/seo/business';
import type { ContactFormValues } from '@/lib/contact-schema';
import type { SubscriberValues } from '@/lib/subscriber-schema';

function client(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

// The contact form's thank-you auto-reply used to live here too. The form
// moved to the BIS Platform (see `lib/platform.ts`), which owns the visitor's
// address from then on; the site only writes to a visitor for a resource
// download, and to the company inbox for a chat-captured lead.
export async function sendResourceEmail(v: SubscriberValues): Promise<void> {
  const res = getResource(v.resource);
  const file = res ? res.files[v.locale] : '';
  const url = `${SITE_URL}${file}`;
  const { error } = await client().emails.send({
    from: process.env.CONTACT_FROM ?? 'onboarding@resend.dev',
    to: v.email,
    replyTo: process.env.CONTACT_REPLY_TO ?? 'bespokeintelligentsolutions@gmail.com',
    subject: resourceSubject(v.locale),
    react: ResourceEmail({ locale: v.locale, name: v.name, url }),
  });
  if (error) throw new Error(error.message);
}

export async function sendLeadNotification(lead: ContactFormValues): Promise<void> {
  const { error } = await client().emails.send({
    from: process.env.CONTACT_FROM ?? 'onboarding@resend.dev',
    to: process.env.CONTACT_NOTIFY_TO ?? 'bespokeintelligentsolutions@gmail.com',
    replyTo: lead.email,
    // Falls back to the person's name: assistant-captured and chat-booked leads
    // carry no businessName, which left the subject ending in a dangling "— ".
    subject: `New assessment request — ${lead.businessName.trim() || lead.fullName}`,
    react: LeadNotification({ lead }),
  });
  if (error) throw new Error(error.message);
}

/**
 * Operational alert to the same inbox that receives lead notifications.
 *
 * Plain text on purpose: this is read at 7 AM on a phone, and it exists to say
 * what broke and what to do about it, not to look like marketing.
 */
export async function sendOperationalAlert(subject: string, body: string): Promise<void> {
  await client().emails.send({
    from: process.env.CONTACT_FROM ?? 'onboarding@resend.dev',
    to: process.env.CONTACT_NOTIFY_TO ?? 'bespokeintelligentsolutions@gmail.com',
    subject,
    text: body,
  });
}
