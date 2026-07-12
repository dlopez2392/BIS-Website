import { describe, it, expect, vi } from 'vitest';
import { processSubscription } from '../process';

const valid = { email: 'a@b.com', resource: 'ai-readiness-checklist', locale: 'en' };
const ok = () => Promise.resolve({ id: '1' });
const okMail = () => Promise.resolve();

describe('processSubscription', () => {
  it('returns ok when both persistence paths succeed', async () => {
    const r = await processSubscription(valid, { insertSubscriber: ok, sendResourceEmail: okMail });
    expect(r).toEqual({ ok: true });
  });
  it('returns ok when only the DB insert succeeds', async () => {
    const r = await processSubscription(valid, { insertSubscriber: ok, sendResourceEmail: () => Promise.reject(new Error('mail')) });
    expect(r).toEqual({ ok: true });
  });
  it('returns ok when only the email succeeds', async () => {
    const r = await processSubscription(valid, { insertSubscriber: () => Promise.reject(new Error('db')), sendResourceEmail: okMail });
    expect(r).toEqual({ ok: true });
  });
  it('returns failed when both paths fail', async () => {
    const r = await processSubscription(valid, { insertSubscriber: () => Promise.reject(new Error('db')), sendResourceEmail: () => Promise.reject(new Error('mail')) });
    expect(r).toEqual({ ok: false, error: 'failed' });
  });
  it('returns invalid on a bad payload', async () => {
    const r = await processSubscription({ email: 'nope' }, { insertSubscriber: ok, sendResourceEmail: okMail });
    expect(r).toEqual({ ok: false, error: 'invalid' });
  });
  it('silently drops a honeypot hit without persisting', async () => {
    const insertSubscriber = vi.fn(ok);
    const sendResourceEmail = vi.fn(okMail);
    const r = await processSubscription({ ...valid, website: 'bot' }, { insertSubscriber, sendResourceEmail });
    expect(r).toEqual({ ok: true });
    expect(insertSubscriber).not.toHaveBeenCalled();
    expect(sendResourceEmail).not.toHaveBeenCalled();
  });
});
