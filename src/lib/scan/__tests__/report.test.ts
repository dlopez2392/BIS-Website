import { describe, it, expect, vi } from 'vitest';
import { requestReport, leadMessage } from '../report';
import { UnsafeTargetError } from '../target';
import type { Evidence } from '../checks';

const clean: Evidence = {
  https: { status: 200, headers: new Headers({ 'x-content-type-options': 'nosniff' }) },
  httpRedirectsToHttps: true,
  txt: [], dmarc: [], mx: ['mail.example.com'], dkimSelectors: [], certDaysLeft: 90, insecureSubresources: 0,
};

const valid = { domain: 'example.com', email: 'owner@example.com', name: 'Ana', locale: 'en' as const };

function deps(over: Record<string, unknown> = {}) {
  return {
    gather: vi.fn().mockResolvedValue(clean),
    allow: vi.fn().mockResolvedValue(true),
    describe: (f: { id: string; status: string }) => ({ title: f.id, explanation: `about ${f.id}`, status: f.status as 'pass' }),
    sendReport: vi.fn().mockResolvedValue(undefined),
    insertLead: vi.fn().mockResolvedValue({ id: 'lead-1' }),
    notifyLead: vi.fn().mockResolvedValue(undefined),
    report: vi.fn().mockResolvedValue(undefined),
    ...over,
  } as unknown as Parameters<typeof requestReport>[1] & {
    gather: ReturnType<typeof vi.fn>;
    sendReport: ReturnType<typeof vi.fn>;
    insertLead: ReturnType<typeof vi.fn>;
    notifyLead: ReturnType<typeof vi.fn>;
    report: ReturnType<typeof vi.fn>;
  };
}

describe('requestReport', () => {
  it('emails the person and records the lead', async () => {
    const d = deps();
    expect(await requestReport(valid, d)).toEqual({ ok: true });
    expect(d.sendReport).toHaveBeenCalledWith(expect.objectContaining({ to: 'owner@example.com', domain: 'example.com', locale: 'en' }));
    expect(d.insertLead).toHaveBeenCalledWith(expect.objectContaining({
      email: 'owner@example.com', businessName: 'example.com', fullName: 'Ana',
    }));
    expect(d.notifyLead).toHaveBeenCalledOnce();
  });

  it('re-runs the scan instead of trusting findings from the browser', async () => {
    // Without this, anyone could have BIS email an authoritative-looking
    // report about a third party, saying whatever they wanted, from a domain
    // that publishes SPF and DMARC precisely so its mail is trusted.
    const d = deps();
    await requestReport({ ...valid, grade: 'A', points: 100, findings: [] }, d);
    expect(d.gather).toHaveBeenCalledWith('example.com');
    const sent = d.sendReport.mock.calls[0][0];
    expect(sent.grade).not.toBe('A');
  });

  it('puts what was found into the lead, so a follow-up call opens with substance', async () => {
    const d = deps();
    await requestReport(valid, d);
    const lead = d.insertLead.mock.calls[0][0];
    expect(lead.message).toContain('[security check] example.com');
    expect(lead.message).toMatch(/scored [A-F]/);
  });

  it('refuses a private or malformed target before any work is done', async () => {
    const d = deps();
    expect(await requestReport({ ...valid, domain: '127.0.0.1' }, d)).toEqual({ ok: false, error: 'invalid' });
    expect(await requestReport({ ...valid, email: 'nope' }, d)).toEqual({ ok: false, error: 'invalid' });
    expect(d.gather).not.toHaveBeenCalled();
    expect(d.sendReport).not.toHaveBeenCalled();
  });

  it('accepts a honeypot hit without sending anything', async () => {
    const d = deps();
    expect(await requestReport({ ...valid, website: 'bot' }, d)).toEqual({ ok: true });
    expect(d.sendReport).not.toHaveBeenCalled();
    expect(d.insertLead).not.toHaveBeenCalled();
  });

  it('checks the limit before spending a scan or an email', async () => {
    const d = deps({ allow: vi.fn().mockResolvedValue(false) });
    expect(await requestReport(valid, d)).toEqual({ ok: false, error: 'rate-limited' });
    expect(d.gather).not.toHaveBeenCalled();
    expect(d.sendReport).not.toHaveBeenCalled();
  });

  it('treats a domain that does not resolve as a typo, not an incident', async () => {
    const d = deps({ gather: vi.fn().mockRejectedValue(new UnsafeTargetError('nope')) });
    expect(await requestReport(valid, d)).toEqual({ ok: false, error: 'unreachable' });
    expect(d.report).not.toHaveBeenCalled();
  });

  it('raises a critical alert when the report cannot be delivered', async () => {
    const d = deps({ sendReport: vi.fn().mockRejectedValue(new Error('resend down')) });
    expect(await requestReport(valid, d)).toEqual({ ok: false, error: 'failed' });
    expect(d.report).toHaveBeenCalledWith(expect.objectContaining({
      event: 'scan.report_email_failed',
      level: 'critical',
      recovery: expect.objectContaining({ Email: 'owner@example.com', Domain: 'example.com' }),
    }));
  });

  it('still serves the visitor when the lead cannot be stored, and alerts', async () => {
    const d = deps({ insertLead: vi.fn().mockRejectedValue(new Error('db down')) });
    expect(await requestReport(valid, d)).toEqual({ ok: true });
    expect(d.sendReport).toHaveBeenCalledOnce();
    expect(d.report).toHaveBeenCalledWith(expect.objectContaining({ event: 'lead.insert_failed', level: 'critical' }));
  });
});

describe('leadMessage', () => {
  it('names the domain, the grade and what was worst', () => {
    const msg = leadMessage('clinic.com', 'D', 55, [
      { title: 'Only your mail servers can send as you', explanation: '', status: 'fail' },
    ]);
    expect(msg).toContain('clinic.com scored D (55/100)');
    expect(msg).toContain('- Only your mail servers can send as you (fail)');
  });
});
