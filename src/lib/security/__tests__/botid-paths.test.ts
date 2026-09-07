import { describe, it, expect } from 'vitest';
import { isBotIdChallengePath, NON_BOTID_PATH_SOURCE } from '../botid-paths';

/**
 * The regression these lock down: the i18n middleware locale-redirected
 * BotID's challenge to /en/<uuid>, the browser got a 404, the challenge was
 * never solved, and every protected endpoint refused every real visitor.
 */
describe('isBotIdChallengePath', () => {
  const A = '149e9513-01fa-4fb0-aad4-566afd725d1b';
  const B = '2d206a39-8ed7-437e-a3be-862e0f1a2b3c';

  it('recognises the two-segment shape seen in production', () => {
    expect(isBotIdChallengePath(`/${A}/${B}`)).toBe(true);
  });

  it('recognises a single-segment challenge path', () => {
    expect(isBotIdChallengePath(`/${A}`)).toBe(true);
  });

  it('recognises deeper paths under a challenge root', () => {
    expect(isBotIdChallengePath(`/${A}/${B}/c`)).toBe(true);
  });

  it('is case-insensitive about hex', () => {
    expect(isBotIdChallengePath(`/${A.toUpperCase()}`)).toBe(true);
  });

  it.each([
    ['the home page', '/'],
    ['a locale root', '/en'],
    ['a real page', '/en/trust'],
    ['a locale-less page the middleware SHOULD redirect', '/services'],
    ['an api route', '/api/chat'],
    ['a guide', '/es/resources/ai-readiness-checklist'],
    ['a file', '/robots.txt'],
  ])('leaves %s to the i18n middleware', (_label, path) => {
    expect(isBotIdChallengePath(path)).toBe(false);
  });

  it('does not match a uuid that is not the FIRST segment', () => {
    expect(isBotIdChallengePath(`/en/${A}`)).toBe(false);
  });

  it('does not match a merely uuid-ish segment', () => {
    expect(isBotIdChallengePath('/149e9513-01fa-4fb0-aad4')).toBe(false);
    expect(isBotIdChallengePath(`/${A}extra`)).toBe(false);
    expect(isBotIdChallengePath(`/zzzzzzzz-01fa-4fb0-aad4-566afd725d1b`)).toBe(false);
  });
});

describe('NON_BOTID_PATH_SOURCE', () => {
  // Next.js compiles `source` with path-to-regexp; this approximates the match
  // closely enough to prove the lookahead selects the right paths.
  const re = new RegExp(`^${NON_BOTID_PATH_SOURCE.replace(/^\//, '\\/')}$`);
  const A = '149e9513-01fa-4fb0-aad4-566afd725d1b';

  it.each(['/', '/en', '/en/trust', '/api/chat', '/robots.txt', '/services'])(
    'still covers %s, so the CSP applies to real pages', (path) => {
      expect(re.test(path)).toBe(true);
    });

  it.each([`/${A}`, `/${A}/x`])('excludes the challenge path %s', (path) => {
    expect(re.test(path)).toBe(false);
  });

  it('agrees with the predicate on every case', () => {
    for (const p of ['/', '/en/trust', `/${A}`, `/${A}/b`, '/api/chat', `/en/${A}`]) {
      expect(re.test(p)).toBe(!isBotIdChallengePath(p));
    }
  });
});
