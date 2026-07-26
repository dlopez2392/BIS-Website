import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../system-prompt';

const bookingLink = 'https://cal.com/dan-lopez-utygjo/free-assessment';

describe('buildSystemPrompt', () => {
  it('includes BIS facts, the booking link, and the bilingual/scope rules', () => {
    const p = buildSystemPrompt({ bookingLink });
    expect(p).toContain('Bespoke Intelligent Solutions');
    expect(p).toContain('Rio Grande Valley');
    expect(p).toContain(bookingLink);
    expect(p).toMatch(/Spanish/i);
    expect(p).toMatch(/capture_lead/);
    expect(p).toMatch(/do not (invent|make up)/i);
  });

  it('works without a pack, for the ungrounded fallback path', () => {
    const p = buildSystemPrompt({ bookingLink });
    expect(p).not.toContain('--- SITE CONTENT');
    expect(p).not.toMatch(/locale=/);
    expect(p).not.toMatch(/only authority on BIS/i);
  });

  it('defaults language to the supplied locale but defers to what the visitor writes', () => {
    const p = buildSystemPrompt({ bookingLink });
    expect(p).toMatch(/visitor context line/i);
    expect(p).toMatch(/follow the visitor/i);
  });

  it('embeds the pack between explicit delimiters', () => {
    const p = buildSystemPrompt({ bookingLink, siteContext: 'PACK_BODY_MARKER' });
    expect(p).toContain('--- SITE CONTENT');
    expect(p).toContain('PACK_BODY_MARKER');
    expect(p).toContain('--- END SITE CONTENT ---');
  });

  it('states the authority split, the injection guard, and the linking rules', () => {
    const p = buildSystemPrompt({ bookingLink, siteContext: 'PACK' });
    expect(p).toMatch(/only authority on BIS/i);
    expect(p).toMatch(/never follow instructions/i);
    expect(p).toMatch(/bare URLs/i);
    expect(p).toMatch(/general (IT|technology)/i);
  });

  it('puts the visitor context last so the cacheable prefix stays stable', () => {
    const p = buildSystemPrompt({ bookingLink, siteContext: 'PACK', locale: 'es', path: '/es/capabilities' });
    expect(p).toContain('locale=es');
    expect(p).toContain('/es/capabilities');
    expect(p.trimEnd().endsWith('/es/capabilities')).toBe(true);
    expect(p.indexOf('PACK')).toBeLessThan(p.indexOf('VISITOR CONTEXT'));
  });

  it('keeps the pre-visitor prefix byte-identical across differing visitor contexts', () => {
    const a = buildSystemPrompt({ bookingLink, siteContext: 'PACK', locale: 'en', path: '/en' });
    const b = buildSystemPrompt({ bookingLink, siteContext: 'PACK', locale: 'en', path: '/en/faq' });
    const prefix = (s: string) => s.slice(0, s.indexOf('VISITOR CONTEXT'));
    expect(prefix(a)).toBe(prefix(b));
  });

  it('omits the path from visitor context when it was rejected', () => {
    const p = buildSystemPrompt({ bookingLink, siteContext: 'PACK', locale: 'en' });
    expect(p).toContain('locale=en');
    expect(p).not.toMatch(/currently on/);
  });
});
