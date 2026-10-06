import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { missedCalls, JOB_SHARE, WEEKS_PER_MONTH } from '../estimate/missed-calls';
import { CALL_CAPTURE_RATE } from '../estimate/hours';

describe('missedCalls — the home page estimate', () => {
  it('turns calls a week and a miss rate into calls a month that ring out', () => {
    // 30 a week, a fifth missed: 6 a week, 26 a month.
    const r = missedCalls({ callsPerWeek: 30, missedPercent: 20, jobValue: 0 });
    expect(r.missedPerMonth).toBe(26);
    expect(r.jobsPerMonth).toBe(6.5);
  });

  it('shows no money until the owner says what a job is worth', () => {
    const r = missedCalls({ callsPerWeek: 30, missedPercent: 20, jobValue: 0 });
    expect(r.lostPerMonth).toBeNull();
    expect(r.recoverablePerMonth).toBeNull();
  });

  it('prices only the share of missed calls counted as jobs, and the part Sofía answers', () => {
    const r = missedCalls({ callsPerWeek: 30, missedPercent: 20, jobValue: 400 });
    const lost = Math.round(30 * 0.2 * WEEKS_PER_MONTH * JOB_SHARE * 400);
    expect(r.lostPerMonth).toBe(lost); // 2600
    expect(r.recoverablePerMonth).toBe(Math.round(lost * CALL_CAPTURE_RATE));
  });

  it('stays quiet with nothing missed, rather than claiming zero', () => {
    expect(missedCalls({ callsPerWeek: 30, missedPercent: 0, jobValue: 400 }).hasInput).toBe(false);
    expect(missedCalls({ callsPerWeek: 0, missedPercent: 50, jobValue: 400 }).lostPerMonth).toBeNull();
  });

  it('treats junk as zero and caps the absurd', () => {
    expect(missedCalls({ callsPerWeek: -5, missedPercent: NaN, jobValue: 400 }).hasInput).toBe(false);
    expect(missedCalls({ callsPerWeek: 30, missedPercent: 900, jobValue: 0 }).missedPerMonth)
      .toBe(Math.round(30 * WEEKS_PER_MONTH));
  });

  it('keeps the job share conservative — the page promises "1 in 4"', () => {
    expect(JOB_SHARE).toBe(0.25);
  });

  it('has its copy in both languages', () => {
    const keys = ['title', 'body', 'callsLabel', 'callsHelp', 'missedLabel', 'missedHelp',
      'jobLabel', 'jobHelp', 'missedLine', 'jobsLine', 'lostLine', 'recoverLine', 'setJob',
      'empty', 'assumption', 'cta', 'more'];
    for (const locale of ['en', 'es']) {
      const m = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', `${locale}.json`), 'utf8'));
      for (const k of keys) expect(m.missedCalls?.[k], `${locale}: missedCalls.${k}`).toBeTruthy();
    }
  });
});
