import { describe, it, expect, vi } from 'vitest';
import { runScan } from '../run';
import { UnsafeTargetError } from '../target';
import type { Evidence } from '../checks';

const clean: Evidence = {
  https: { status: 200, headers: new Headers({
    'strict-transport-security': 'max-age=63072000',
    'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  }) },
  httpRedirectsToHttps: true,
  txt: ['v=spf1 -all'],
  dmarc: ['v=DMARC1; p=reject'],
  mx: ['mail.example.com'],
  dkimSelectors: ['google'],
  certDaysLeft: 90,
  insecureSubresources: 0,
};

function deps(over: Partial<Parameters<typeof runScan>[1]> = {}) {
  return {
    gather: vi.fn().mockResolvedValue(clean),
    allow: vi.fn().mockResolvedValue(true),
    report: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

describe('runScan', () => {
  it('grades a well-configured domain and reports nothing', async () => {
    const d = deps();
    const result = await runScan('https://Example.com/pricing', d);
    expect(result).toMatchObject({ ok: true, domain: 'example.com', grade: 'A' });
    expect(d.report).not.toHaveBeenCalled();
  });

  it('refuses a private target before any network call is made', async () => {
    const d = deps();
    expect(await runScan('http://192.168.1.1/', d)).toEqual({ ok: false, error: 'ip-address' });
    expect(await runScan('printer.local', d)).toEqual({ ok: false, error: 'not-public' });
    expect(d.gather).not.toHaveBeenCalled();
  });

  it('checks the rate limit before spending a request on someone else\'s server', async () => {
    const d = deps({ allow: vi.fn().mockResolvedValue(false) });
    expect(await runScan('example.com', d)).toEqual({ ok: false, error: 'rate-limited' });
    expect(d.gather).not.toHaveBeenCalled();
  });

  it('treats a name that does not resolve as the visitor\'s typo, not an incident', async () => {
    // Node throws its own ENOTFOUND here, which is why the signal is a type
    // and not the wording of a message.
    const d = deps({ gather: vi.fn().mockRejectedValue(new UnsafeTargetError('nope.com does not resolve')) });
    expect(await runScan('nope.com', d)).toEqual({ ok: false, error: 'unreachable' });
    expect(d.report).not.toHaveBeenCalled();
  });

  it('reports a genuine failure rather than blaming the visitor', async () => {
    const d = deps({ gather: vi.fn().mockRejectedValue(new Error('socket hang up')) });
    expect(await runScan('example.com', d)).toEqual({ ok: false, error: 'failed' });
    expect(d.report).toHaveBeenCalledWith(expect.objectContaining({ event: 'scan.failed' }));
  });
});
