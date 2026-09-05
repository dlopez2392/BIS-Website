import { describe, it, expect } from 'vitest';
import { PROTECTED_ROUTES } from '../protected-routes';
import { resources } from '@/lib/resources';
import { routing } from '@/i18n/routing';

describe('PROTECTED_ROUTES', () => {
  it('covers the chat endpoint, which spends model tokens per message', () => {
    expect(PROTECTED_ROUTES).toContainEqual({ path: '/api/chat', method: 'POST' });
  });

  it('covers every guide in both languages, so a new guide cannot ship unprotected', () => {
    for (const locale of routing.locales) {
      for (const r of resources) {
        expect(PROTECTED_ROUTES).toContainEqual({ path: `/${locale}/resources/${r.slug}`, method: 'POST' });
      }
    }
    expect(PROTECTED_ROUTES).toHaveLength(1 + routing.locales.length * resources.length);
  });

  it('protects nothing a search or answer engine needs to read', () => {
    // Every entry is a POST. A GET here would put the challenge in front of a
    // page that robots.txt explicitly invites crawlers to fetch.
    expect(PROTECTED_ROUTES.every((r) => r.method === 'POST')).toBe(true);
  });
});
