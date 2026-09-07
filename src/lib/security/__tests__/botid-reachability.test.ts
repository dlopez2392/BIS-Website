import { describe, it, expect } from 'vitest';
import { contentSecurityPolicy, securityHeaders } from '../headers';
import { isBotIdChallengePath, NON_BOTID_PATH_SOURCE } from '../botid-paths';

/**
 * The regression suite for 2026-09-07.
 *
 * Four things broke the bot check on this site at once, each hiding the next,
 * and every one of them was a security control that was correct for the site
 * as it stood and silently wrong for a capability added later. None of them
 * failed loudly: the only symptom was a 403, identical whether the cause was
 * a middleware redirect, a blocked iframe, an over-broad CSP, or a level
 * mismatch. Real visitors were turned away from chat, the security checker,
 * the guide forms and the voice demo for weeks.
 *
 * These assertions are deliberately about REACHABILITY rather than about any
 * one directive's value. They are the questions someone should have been able
 * to ask in CI: can the challenge be requested, can it be framed, and is it
 * governed by a policy that is not ours to impose?
 */
describe('the bot challenge must be able to load', () => {
  const A = '149e9513-01fa-4fb0-aad4-566afd725d1b';
  const challenge = `/${A}/2d206a39-8ed7-437e-a3be-862e0f1a2b3c`;

  it('is not swallowed by the i18n middleware — it must not be locale-redirected', () => {
    expect(isBotIdChallengePath(challenge)).toBe(true);
  });

  it('is excluded from the CSP scope, so our script-src cannot govern it', () => {
    const covered = new RegExp(`^${NON_BOTID_PATH_SOURCE.replace(/^\//, '\\/')}$`);
    expect(covered.test(challenge)).toBe(false);
    expect(covered.test('/en/trust')).toBe(true);
  });

  it('can be framed, because the challenge renders in an own-origin iframe', () => {
    expect(/frame-src ([^;]*)/.exec(contentSecurityPolicy())![1]).toContain("'self'");
  });

  it('still receives the protections that do not constrain execution', () => {
    const keys = securityHeaders({ csp: false }).map((h) => h.key);
    expect(keys).toContain('Strict-Transport-Security');
    expect(keys).toContain('X-Content-Type-Options');
  });

  it('leaves ordinary pages fully governed — none of the above is a blanket hole', () => {
    const covered = new RegExp(`^${NON_BOTID_PATH_SOURCE.replace(/^\//, '\\/')}$`);
    for (const page of ['/', '/en', '/en/trust', '/es/contact', '/api/chat']) {
      expect(isBotIdChallengePath(page)).toBe(false);
      expect(covered.test(page)).toBe(true);
    }
  });
});
