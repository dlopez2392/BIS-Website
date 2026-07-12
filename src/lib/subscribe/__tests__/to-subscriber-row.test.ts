import { describe, it, expect } from 'vitest';
import { toSubscriberRow } from '../to-subscriber-row';

describe('toSubscriberRow', () => {
  it('maps values and nulls an empty name', () => {
    const row = toSubscriberRow({ name: '', email: 'a@b.com', resource: 'ai-readiness-checklist', locale: 'en', newsletterConsent: true });
    expect(row).toEqual({ email: 'a@b.com', name: null, resource: 'ai-readiness-checklist', locale: 'en', newsletterConsent: true });
  });
  it('keeps a provided name', () => {
    const row = toSubscriberRow({ name: 'Dan', email: 'a@b.com', resource: 'x', locale: 'es', newsletterConsent: false });
    expect(row.name).toBe('Dan');
  });
});
