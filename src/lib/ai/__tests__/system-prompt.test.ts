import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../system-prompt';

describe('buildSystemPrompt', () => {
  it('includes BIS facts, the booking link, and the bilingual/scope rules', () => {
    const p = buildSystemPrompt({ bookingLink: 'https://cal.com/dan-lopez-utygjo/free-assessment' });
    expect(p).toContain('Bespoke Intelligent Solutions');
    expect(p).toContain('Rio Grande Valley');
    expect(p).toContain('https://cal.com/dan-lopez-utygjo/free-assessment');
    expect(p).toMatch(/Spanish/i);
    expect(p).toMatch(/capture_lead/);
    expect(p).toMatch(/do not (invent|make up)/i);
  });
});
