import { describe, it, expect } from 'vitest';
import { estimate, CALL_CAPTURE_RATE, ADMIN_AUTOMATION_RATE, WORKING_WEEKS } from '../hours';

const base = { missedCallsPerWeek: 0, adminHoursPerWeek: 0, hourlyValue: 0, spanishSharePercent: 0 };

describe('estimate', () => {
  it('stays quiet when nothing has been entered, rather than claiming zero savings', () => {
    expect(estimate(base).hasInput).toBe(false);
  });

  it('returns hours an owner can check against their own week', () => {
    const r = estimate({ ...base, adminHoursPerWeek: 10 });
    expect(r.hoursPerWeek).toBe(3.5);
    expect(r.hoursPerYear).toBe(175);
  });

  it('never invents a dollar figure the owner did not supply an hourly value for', () => {
    expect(estimate({ ...base, adminHoursPerWeek: 10 }).valuePerYear).toBeNull();
    expect(estimate({ ...base, adminHoursPerWeek: 10, hourlyValue: 60 }).valuePerYear).toBe(175 * 60);
  });

  it('does not claim every missed call is recovered', () => {
    expect(CALL_CAPTURE_RATE).toBeLessThan(1);
    expect(estimate({ ...base, missedCallsPerWeek: 10 }).callsAnswered).toBe(8);
  });

  it('claims about a third of admin, not most of it', () => {
    expect(ADMIN_AUTOMATION_RATE).toBeLessThanOrEqual(0.4);
  });

  it('uses working weeks rather than 52 optimistic ones', () => {
    expect(WORKING_WEEKS).toBeLessThan(52);
  });

  it('leads with the bilingual answer only when enough customers prefer Spanish', () => {
    expect(estimate({ ...base, spanishSharePercent: 10 }).bilingualMatters).toBe(false);
    expect(estimate({ ...base, spanishSharePercent: 40 }).bilingualMatters).toBe(true);
  });

  it('refuses nonsense input instead of printing a nonsense number', () => {
    const r = estimate({ missedCallsPerWeek: -5, adminHoursPerWeek: NaN, hourlyValue: Infinity, spanishSharePercent: 900 });
    expect(r.callsAnswered).toBe(0);
    expect(r.hoursPerWeek).toBe(0);
    expect(r.valuePerYear).toBeNull();
    expect(r.bilingualMatters).toBe(true); // 900 clamps to 100
  });

  it('caps an implausible entry so the page cannot be made to show an absurd figure', () => {
    const r = estimate({ ...base, adminHoursPerWeek: 100000, hourlyValue: 100000 });
    expect(r.hoursPerWeek).toBeLessThanOrEqual(80 * ADMIN_AUTOMATION_RATE);
    expect(r.valuePerYear).toBeLessThanOrEqual(80 * ADMIN_AUTOMATION_RATE * WORKING_WEEKS * 1000);
  });
});
