import { describe, it, expect, vi } from 'vitest';
import { verifyHuman } from '../verify-human';
import { CHAT_ROUTE } from '../protected-routes';

const report = () => Promise.resolve();
const path = CHAT_ROUTE;

describe('verifyHuman', () => {
  it('allows a person', async () => {
    const r = await verifyHuman({ check: async () => ({ isBot: false, isVerifiedBot: false }), report, path });
    expect(r).toEqual({ allowed: true, degraded: false });
  });

  it('blocks an unverified bot', async () => {
    const r = await verifyHuman({ check: async () => ({ isBot: true, isVerifiedBot: false }), report, path });
    expect(r).toEqual({ allowed: false, degraded: false });
  });

  it('allows a verified crawler, because robots.txt already invited it', async () => {
    const r = await verifyHuman({ check: async () => ({ isBot: true, isVerifiedBot: true }), report, path });
    expect(r.allowed).toBe(true);
  });

  it('fails open when the check itself cannot run, and reports the misconfiguration', async () => {
    // The real failure this guards: no OIDC token, so every visitor would get
    // a 500 from a feature meant to protect them.
    const spy = vi.fn().mockResolvedValue(undefined);
    const r = await verifyHuman({
      check: async () => { throw new Error("The 'x-vercel-oidc-token' header is missing from the request."); },
      report: spy,
      path,
    });
    expect(r).toEqual({ allowed: true, degraded: true });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ event: 'botid.unavailable', level: 'error' }));
  });

  it('asks at the level the client challenge was armed with, because a mismatch fails verification', async () => {
    const levels: string[] = [];
    await verifyHuman({
      check: async (options) => { levels.push(options.advancedOptions.checkLevel); return { isBot: false, isVerifiedBot: false }; },
      report,
      path: CHAT_ROUTE,
    });
    expect(levels).toEqual(['deepAnalysis']);
  });

  it('refuses to guess for a path nobody armed', async () => {
    // The bug this guards: the security checker shipped calling checkBotId()
    // on a page that was never in the client-side list, so the server asked
    // about a challenge the browser was never told to solve.
    await expect(verifyHuman({
      check: async () => ({ isBot: false, isVerifiedBot: false }),
      report,
      path: '/en/some-page-nobody-protected',
    })).rejects.toThrow(/not in PROTECTED_ROUTES/);
  });
});
