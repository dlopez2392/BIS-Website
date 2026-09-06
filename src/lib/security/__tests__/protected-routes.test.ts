import { describe, it, expect } from 'vitest';
import { PROTECTED_ROUTES, checkLevelFor, securityCheckPath, CHAT_ROUTE, SOFIA_TICKET_ROUTE } from '../protected-routes';
import { resources } from '@/lib/resources';
import { routing } from '@/i18n/routing';

describe('PROTECTED_ROUTES', () => {
  it('covers the chat endpoint, which spends model tokens per message', () => {
    expect(PROTECTED_ROUTES.map((r) => r.path)).toContain(CHAT_ROUTE);
  });

  it('covers the security checker, which makes requests to other servers from our address', () => {
    for (const locale of routing.locales) {
      expect(PROTECTED_ROUTES.map((r) => r.path)).toContain(securityCheckPath(locale));
    }
  });

  it('spends deep analysis only where a bot getting through costs more than the check', () => {
    expect(checkLevelFor(CHAT_ROUTE)).toBe('deepAnalysis');
    expect(checkLevelFor(securityCheckPath('en'))).toBe('deepAnalysis');
    expect(checkLevelFor('/en/resources/ai-readiness-checklist')).toBe('basic');
  });

  it('throws for a path that was never armed, rather than guessing a level', () => {
    expect(() => checkLevelFor('/en/faq')).toThrow(/not in PROTECTED_ROUTES/);
  });

  it('covers every guide in both languages, so a new guide cannot ship unprotected', () => {
    for (const locale of routing.locales) {
      for (const r of resources) {
        expect(PROTECTED_ROUTES.map((p) => p.path)).toContain(`/${locale}/resources/${r.slug}`);
      }
    }
    // The two fixed API routes (chat, Sofía ticket) + one security-check page
    // per locale + one page per guide per locale. The literal is the point:
    // it fails when an entry is added without a deliberate look at this list.
    const FIXED_API_ROUTES = 2;
    expect(PROTECTED_ROUTES).toHaveLength(
      FIXED_API_ROUTES + routing.locales.length + routing.locales.length * resources.length,
    );
  });

  it('protects nothing a search or answer engine needs to read', () => {
    // Every entry is a POST. A GET here would put the challenge in front of a
    // page that robots.txt explicitly invites crawlers to fetch.
    expect(PROTECTED_ROUTES.every((r) => r.method === 'POST')).toBe(true);
  });
});

describe('the Sofía ticket route', () => {
  it('is armed, so the browser is told to solve the challenge the server asks about', () => {
    expect(PROTECTED_ROUTES.map((r) => r.path)).toContain(SOFIA_TICKET_ROUTE);
  });

  it('is verified at the same depth the server will ask for', () => {
    expect(checkLevelFor(SOFIA_TICKET_ROUTE)).toBe('deepAnalysis');
  });

  it('is checked at least as deeply as chat — it costs more per request', () => {
    const rank = { basic: 0, deepAnalysis: 1 } as const;
    expect(rank[checkLevelFor(SOFIA_TICKET_ROUTE)]).toBeGreaterThanOrEqual(rank[checkLevelFor(CHAT_ROUTE)]);
  });
});
