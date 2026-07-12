import { describe, it, expect, vi } from 'vitest';

vi.mock('@/db', () => ({ db: { insert: vi.fn() } }));
vi.mock('@/db/schema', () => ({ subscribers: { __table: 'subscribers' } }));

import { toSubscriberRow } from '../repository';

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
