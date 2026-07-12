import { describe, it, expect } from 'vitest';
import { subscriberSchema } from '../subscriber-schema';

describe('subscriberSchema', () => {
  it('accepts a valid subscription and defaults name/consent', () => {
    const r = subscriberSchema.safeParse({ email: 'a@b.com', resource: 'ai-readiness-checklist', locale: 'en' });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.name).toBe(''); expect(r.data.newsletterConsent).toBe(false); }
  });
  it('rejects a bad email', () => {
    expect(subscriberSchema.safeParse({ email: 'nope', resource: 'x', locale: 'en' }).success).toBe(false);
  });
  it('rejects an unknown locale', () => {
    expect(subscriberSchema.safeParse({ email: 'a@b.com', resource: 'x', locale: 'fr' }).success).toBe(false);
  });
});
