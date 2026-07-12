import type { SubscriberValues } from '@/lib/subscriber-schema';

export function toSubscriberRow(v: SubscriberValues) {
  return {
    email: v.email,
    name: v.name ? v.name : null,
    resource: v.resource,
    locale: v.locale,
    newsletterConsent: v.newsletterConsent,
  };
}
