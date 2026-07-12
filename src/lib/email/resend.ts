import { Resend } from 'resend';
import { ThankYou } from '@/emails/ThankYou';
import { LeadNotification } from '@/emails/LeadNotification';
import { ResourceEmail } from '@/emails/ResourceEmail';
import { thankYouSubject, resourceSubject, type EmailLocale } from '@/emails/messages';
import { getResource } from '@/lib/resources';
import { SITE_URL } from '@/lib/seo/business';
import type { ContactFormValues } from '@/lib/contact-schema';
import type { SubscriberValues } from '@/lib/subscriber-schema';

function client(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendThankYou(lead: ContactFormValues): Promise<void> {
  const locale = lead.language as EmailLocale;
  const { error } = await client().emails.send({
    from: process.env.CONTACT_FROM ?? 'onboarding@resend.dev',
    to: lead.email,
    replyTo: process.env.CONTACT_REPLY_TO ?? 'bespokeintelligentsolutions@gmail.com',
    subject: thankYouSubject(locale),
    react: ThankYou({ locale, fullName: lead.fullName }),
  });
  if (error) throw new Error(error.message);
}

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
    subject: `New assessment request — ${lead.businessName}`,
    react: LeadNotification({ lead }),
  });
  if (error) throw new Error(error.message);
}
