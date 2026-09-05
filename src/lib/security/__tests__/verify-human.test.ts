import { describe, it, expect, vi } from 'vitest';
import { verifyHuman } from '../verify-human';

const report = () => Promise.resolve();

describe('verifyHuman', () => {
  it('allows a person', async () => {
    const r = await verifyHuman({ check: async () => ({ isBot: false, isVerifiedBot: false }), report });
    expect(r).toEqual({ allowed: true, degraded: false });
  });

  it('blocks an unverified bot', async () => {
    const r = await verifyHuman({ check: async () => ({ isBot: true, isVerifiedBot: false }), report });
    expect(r).toEqual({ allowed: false, degraded: false });
  });

  it('allows a verified crawler, because robots.txt already invited it', async () => {
    const r = await verifyHuman({ check: async () => ({ isBot: true, isVerifiedBot: true }), report });
    expect(r.allowed).toBe(true);
  });

  it('fails open when the check itself cannot run, and reports the misconfiguration', async () => {
    // The real failure this guards: no OIDC token, so every visitor would get
    // a 500 from a feature meant to protect them.
    const spy = vi.fn().mockResolvedValue(undefined);
    const r = await verifyHuman({
      check: async () => { throw new Error("The 'x-vercel-oidc-token' header is missing from the request."); },
      report: spy,
    });
    expect(r).toEqual({ allowed: true, degraded: true });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ event: 'botid.unavailable', level: 'error' }));
  });
});
