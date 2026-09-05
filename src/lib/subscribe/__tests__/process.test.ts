import { describe, it, expect, vi } from 'vitest';
import { processSubscription } from '../process';

const valid = { email: 'a@b.com', resource: 'ai-readiness-checklist', locale: 'en' };
const ok = () => Promise.resolve({ id: '1' });
const okMail = () => Promise.resolve();
const report = () => Promise.resolve();

describe('processSubscription', () => {
  it('returns ok when both persistence paths succeed', async () => {
    const r = await processSubscription(valid, { insertSubscriber: ok, sendResourceEmail: okMail, report });
    expect(r).toEqual({ ok: true });
  });
  it('returns ok when only the DB insert succeeds', async () => {
    const r = await processSubscription(valid, { insertSubscriber: ok, sendResourceEmail: () => Promise.reject(new Error('mail')), report });
    expect(r).toEqual({ ok: true });
  });
  it('returns ok when only the email succeeds', async () => {
    const r = await processSubscription(valid, { insertSubscriber: () => Promise.reject(new Error('db')), sendResourceEmail: okMail, report });
    expect(r).toEqual({ ok: true });
  });
  it('returns failed when both paths fail', async () => {
    const r = await processSubscription(valid, { insertSubscriber: () => Promise.reject(new Error('db')), sendResourceEmail: () => Promise.reject(new Error('mail')), report });
    expect(r).toEqual({ ok: false, error: 'failed' });
  });
  it('returns invalid on a bad payload', async () => {
    const r = await processSubscription({ email: 'nope' }, { insertSubscriber: ok, sendResourceEmail: okMail, report });
    expect(r).toEqual({ ok: false, error: 'invalid' });
  });
  it('alerts, with the details to recover the request, when nothing was captured', async () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    await processSubscription({ ...valid, name: 'Luis' }, {
      insertSubscriber: () => Promise.reject(new Error('db')),
      sendResourceEmail: () => Promise.reject(new Error('mail')),
      report: spy,
    });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      event: 'subscribe.lost',
      level: 'critical',
      recovery: { Name: 'Luis', Email: 'a@b.com', Guide: 'ai-readiness-checklist', Language: 'en' },
    }));
  });

  it('records a half-failure so it is noticed before the other half breaks too', async () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    await processSubscription(valid, { insertSubscriber: () => Promise.reject(new Error('db')), sendResourceEmail: okMail, report: spy });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ event: 'subscribe.insert_failed', level: 'error' }));
  });

  it('silently drops a honeypot hit without persisting', async () => {
    const insertSubscriber = vi.fn(ok);
    const sendResourceEmail = vi.fn(okMail);
    const r = await processSubscription({ ...valid, website: 'bot' }, { insertSubscriber, sendResourceEmail, report });
    expect(r).toEqual({ ok: true });
    expect(insertSubscriber).not.toHaveBeenCalled();
    expect(sendResourceEmail).not.toHaveBeenCalled();
  });
});
