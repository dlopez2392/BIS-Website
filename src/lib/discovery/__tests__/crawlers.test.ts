import { describe, it, expect } from 'vitest';
import { robotsTxt, ANSWER_CRAWLERS, TRAINING_CRAWLERS, CONTENT_SIGNAL } from '../crawlers';

const txt = robotsTxt({ siteUrl: 'https://bis-rgv.com' });

/** The rules that apply to one user-agent, up to the next blank line. */
function block(agent: string): string[] {
  const lines = txt.split('\n');
  const start = lines.findIndex((l) => l === `User-Agent: ${agent}`);
  if (start < 0) throw new Error(`robots.txt names no agent ${agent}`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l === '');
  return rest.slice(0, end < 0 ? undefined : end);
}

describe('robots.txt', () => {
  it('states the content signal: indexable, quotable, not training material', () => {
    expect(txt).toContain(CONTENT_SIGNAL);
    expect(CONTENT_SIGNAL).toContain('search=yes');
    expect(CONTENT_SIGNAL).toContain('ai-input=yes');
    expect(CONTENT_SIGNAL).toContain('ai-train=no');
  });

  it('still lets ordinary search engines crawl everything but the API', () => {
    expect(block('*')).toEqual(['Allow: /', 'Disallow: /api/']);
  });

  it('welcomes every answer engine, so BIS can be cited in AI answers', () => {
    for (const agent of ANSWER_CRAWLERS) expect(block(agent)).toEqual(['Allow: /', 'Disallow: /api/']);
  });

  it('declines every training crawler, matching the ai-train signal', () => {
    for (const agent of TRAINING_CRAWLERS) expect(block(agent)).toEqual(['Disallow: /']);
  });

  it('never both welcomes and declines the same crawler', () => {
    const overlap = ANSWER_CRAWLERS.filter((a) => (TRAINING_CRAWLERS as readonly string[]).includes(a));
    expect(overlap).toEqual([]);
  });

  it('keeps Gemini grounding rather than trading visibility for a training block', () => {
    // Google-Extended is one switch over both. See the note in crawlers.ts.
    expect(ANSWER_CRAWLERS).toContain('Google-Extended');
  });

  it('points at the sitemap', () => {
    expect(txt).toContain('Sitemap: https://bis-rgv.com/sitemap.xml');
  });
});
