import { describe, it, expect, vi } from 'vitest';
import { makeReporter, throttleWith, maskPii, ALERT_THROTTLE_SECONDS } from '../report';
import { createMemoryCounter } from '@/lib/limits';

function harness({ shouldAlert = true }: { shouldAlert?: boolean } = {}) {
  const lines: string[] = [];
  const alerts: { subject: string; body: string }[] = [];
  const reporter = makeReporter({
    now: () => new Date('2026-09-05T12:00:00.000Z'),
    log: (line) => lines.push(line),
    sendAlert: async (subject, body) => { alerts.push({ subject, body }); },
    shouldAlert: async () => shouldAlert,
  });
  return { reporter, lines, alerts, logged: () => lines.map((l) => JSON.parse(l)) };
}

describe('maskPii', () => {
  it('keeps enough of an address to recognize it and not enough to use it', () => {
    expect(maskPii('reached maria.garcia@example.com')).toBe('reached m***@example.com');
  });

  it('masks phone numbers', () => {
    expect(maskPii('called +1-956-506-1545 twice')).toBe('called +1***45 twice');
  });

  it('leaves ordinary text alone', () => {
    expect(maskPii('connect ETIMEDOUT after 30s')).toBe('connect ETIMEDOUT after 30s');
  });
});

describe('report', () => {
  it('writes one structured line with a stable event name', async () => {
    const h = harness();
    await h.reporter.report({ event: 'lead.insert_failed', level: 'critical', error: new Error('down') });
    expect(h.logged()).toEqual([{
      at: '2026-09-05T12:00:00.000Z',
      level: 'critical',
      event: 'lead.insert_failed',
      error: 'Error: down',
    }]);
  });

  it('masks personal details in the log but not in the alert a person must act on', async () => {
    const h = harness();
    await h.reporter.report({
      event: 'lead.insert_failed',
      level: 'critical',
      error: new Error('db down'),
      context: { email: 'maria.garcia@example.com' },
      recovery: { Email: 'maria.garcia@example.com', Need: 'AI phone answering' },
    });
    expect(h.logged()[0].email).toBe('m***@example.com');
    expect(h.alerts[0].body).toContain('maria.garcia@example.com');
    expect(h.alerts[0].body).toContain('AI phone answering');
    expect(h.alerts[0].subject).toBe('[bis-rgv.com] lead.insert_failed');
  });

  it('emails only for critical, never for a failure the request recovered from', async () => {
    const h = harness();
    await h.reporter.report({ event: 'lead.notify_failed', level: 'error', error: new Error('smtp') });
    expect(h.lines).toHaveLength(1);
    expect(h.alerts).toEqual([]);
  });

  it('stays quiet when the throttle says an alert already went out', async () => {
    const h = harness({ shouldAlert: false });
    await h.reporter.report({ event: 'lead.insert_failed', level: 'critical' });
    expect(h.lines).toHaveLength(1); // still logged
    expect(h.alerts).toEqual([]);    // not emailed again
  });

  it('never throws, and says so in the log, when the alert transport itself fails', async () => {
    const lines: string[] = [];
    const reporter = makeReporter({
      now: () => new Date(),
      log: (line) => lines.push(line),
      sendAlert: async () => { throw new Error('resend 500'); },
      shouldAlert: async () => true,
    });
    await expect(reporter.report({ event: 'lead.insert_failed', level: 'critical' })).resolves.toBeUndefined();
    expect(lines.some((l) => l.includes('report.failed'))).toBe(true);
  });

  it('survives an error that cannot be serialized', async () => {
    const h = harness();
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    await h.reporter.report({ event: 'chat.stream_failed', level: 'error', error: circular });
    expect(h.lines).toHaveLength(1);
  });
});

describe('throttleWith', () => {
  it('allows the first alert for an event and suppresses the rest of the window', async () => {
    const at = vi.fn(() => 0);
    const throttle = throttleWith(createMemoryCounter(at));
    expect(await throttle('lead.insert_failed')).toBe(true);
    expect(await throttle('lead.insert_failed')).toBe(false);
    // A different failure is never suppressed by an unrelated one.
    expect(await throttle('chat.stream_failed')).toBe(true);
    at.mockReturnValue(ALERT_THROTTLE_SECONDS * 1000 + 1);
    expect(await throttle('lead.insert_failed')).toBe(true);
  });

  it('sends rather than silences when the shared counter is broken', async () => {
    const throttle = throttleWith({ incr: async () => { throw new Error('redis down'); } });
    expect(await throttle('lead.insert_failed')).toBe(true);
  });
});
