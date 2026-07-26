import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../system-prompt';
import { business } from '@/lib/seo/business';

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

  it('forbids all markdown, not just headings, because the widget renders raw text', () => {
    // Live probes on 2026-07-26 came back with **bold** and "- " bullets: the
    // original rule only banned headings, so asterisks reached the visitor.
    const p = buildSystemPrompt({ bookingLink });
    expect(p).toMatch(/PLAIN TEXT ONLY/);
    expect(p).toMatch(/asterisks/i);
    expect(p).toMatch(/bullet/i);
    expect(p).toMatch(/heading/i);
  });

  it('works without a pack, for the ungrounded fallback path', () => {
    const p = buildSystemPrompt({ bookingLink });
    expect(p).not.toContain('--- SITE CONTENT');
    expect(p).not.toMatch(/locale=/);
    expect(p).not.toMatch(/only authority on BIS/i);
  });

  it('states the language rule: default to the visitor context locale, but follow what the visitor writes', () => {
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
    // The prefix being stable is only half the cache property: the visitor
    // line must also be the LAST thing in the prompt, or a stable prefix
    // would still sit in front of variable content. Asserted here too so
    // this test fails on its own if the line is ever spliced in earlier.
    expect(prefix(a)).toContain('END SITE CONTENT');
    expect(a.trimEnd().endsWith('/en')).toBe(true);
    expect(b.trimEnd().endsWith('/en/faq')).toBe(true);
  });

  it('omits the path from visitor context when it was rejected', () => {
    const p = buildSystemPrompt({ bookingLink, siteContext: 'PACK', locale: 'en' });
    expect(p).toContain('locale=en');
    expect(p).not.toMatch(/currently on/);
  });

  it('uses the passed locale for the LINKING example URL, defaulting to en when absent', () => {
    const es = buildSystemPrompt({ bookingLink, siteContext: 'PACK', locale: 'es' });
    expect(es).toContain(`${business.url}/es/faq`);
    expect(es).not.toContain(`${business.url}/en/faq`);

    const noLocale = buildSystemPrompt({ bookingLink, siteContext: 'PACK' });
    expect(noLocale).toContain(`${business.url}/en/faq`);
  });
});
