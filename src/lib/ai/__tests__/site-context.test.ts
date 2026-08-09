import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildSiteContext,
  PACK_MAX_CHARS,
  SERVICE_GROUP_IDS,
  CREDENTIAL_COUNT,
  METHOD_COUNT,
  PROCESS_STEP_COUNT,
  RESOURCE_POINT_COUNT,
} from '../site-context';
import { business } from '@/lib/seo/business';
import { faqItemIds } from '@/lib/faq';
import { capabilityGroups, expertiseIds } from '@/lib/tech/capabilities';
import { resources } from '@/lib/resources';
import type { PostMeta } from '@/lib/insights';

const readMessages = (file: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', file), 'utf8')) as Record<string, unknown>;

const en = readMessages('en.json');
const es = readMessages('es.json');

const posts: PostMeta[] = [
  {
    slug: 'find-your-first-hour-back',
    title: 'Find your first hour back',
    description: 'Where to look for the first hour automation can return to you.',
    category: 'AI',
    date: '2026-07-10',
    readingMinutes: 4,
  },
  {
    slug: 'bilingual-by-design',
    title: 'Bilingual by design',
    description: 'Why serving the Valley means building in both languages from day one.',
    category: 'Culture',
    date: '2026-07-11',
    readingMinutes: 5,
  },
];

const enPack = buildSiteContext({ locale: 'en', messages: en, posts });
const esPack = buildSiteContext({ locale: 'es', messages: es, posts });

describe('buildSiteContext', () => {
  it('includes core business facts and every service area', () => {
    expect(enPack).toContain(business.name);
    expect(enPack).toContain(business.founder);
    expect(enPack).toContain(business.email);
    for (const area of business.areaServed) expect(enPack, `area ${area}`).toContain(area);
  });

  it('includes every FAQ question and answer', () => {
    const items = (en.faq as { items: Record<string, { q: string; a: string }> }).items;
    for (const id of faqItemIds) {
      expect(enPack, `q ${id}`).toContain(items[id].q);
      expect(enPack, `a ${id}`).toContain(items[id].a);
    }
  });

  it('includes every capability group label and every product name', () => {
    const groups = (en.capabilities as { groups: Record<string, string> }).groups;
    for (const g of capabilityGroups) {
      expect(enPack, `group ${g.id}`).toContain(groups[g.id]);
      for (const item of g.items) expect(enPack, `product ${item}`).toContain(item);
    }
  });

  it('includes every expertise label', () => {
    const expertise = (en.capabilities as { expertise: Record<string, string> }).expertise;
    for (const id of expertiseIds) expect(enPack, `expertise ${id}`).toContain(expertise[id]);
  });

  it('includes the process steps, pricing model, and what-to-expect', () => {
    const hww = en.howWeWork as Record<string, string>;
    for (const n of [1, 2, 3, 4]) {
      expect(enPack, `step ${n}`).toContain(hww[`step${n}Title`]);
      expect(enPack, `step ${n} body`).toContain(hww[`step${n}Body`]);
    }
    expect(enPack).toContain(hww.pricingBody);
    expect(enPack).toContain(hww.expectBody);
  });

  it('includes the founder bio, all 8 credentials, and all 4 method blocks', () => {
    const about = en.about as Record<string, string>;
    expect(enPack).toContain(about.founderBio);
    for (let n = 1; n <= 8; n++) expect(enPack, `cred ${n}`).toContain(about[`cred${n}Title`]);
    for (let n = 1; n <= 4; n++) expect(enPack, `method ${n}`).toContain(about[`m${n}Title`]);
  });

  it('includes each resource with its locale-prefixed detail URL', () => {
    for (const r of resources) {
      expect(enPack, `resource ${r.slug}`).toContain(`${business.url}/en/resources/${r.slug}`);
    }
  });

  it('includes each post with title, description, and locale-prefixed URL', () => {
    for (const p of posts) {
      expect(enPack).toContain(p.title);
      expect(enPack).toContain(p.description);
      expect(enPack).toContain(`${business.url}/en/insights/${p.slug}`);
    }
  });

  it('lists posts newest first', () => {
    expect(enPack.indexOf('Bilingual by design')).toBeLessThan(enPack.indexOf('Find your first hour back'));
  });

  it('handles an empty post list without throwing', () => {
    expect(() => buildSiteContext({ locale: 'en', messages: en, posts: [] })).not.toThrow();
  });

  it('emits a page map whose every URL carries the locale prefix', () => {
    for (const p of ['/services', '/industries', '/about', '/how-we-work', '/work', '/capabilities', '/faq', '/service-area', '/insights', '/resources', '/contact', '/privacy']) {
      expect(enPack, `en ${p}`).toContain(`${business.url}/en${p}`);
      expect(esPack, `es ${p}`).toContain(`${business.url}/es${p}`);
    }
  });

  it('never emits an unprefixed site URL', () => {
    const bad = new RegExp(`${business.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(?!en/|es/|en\\b|es\\b)`, 'g');
    expect(enPack.match(bad)).toBeNull();
    expect(esPack.match(bad)).toBeNull();
  });

  it('builds Spanish from Spanish copy', () => {
    const esFaq = (es.faq as { items: Record<string, { q: string }> }).items;
    expect(esPack).toContain(esFaq.whatIsBis.q);
    expect(esPack).not.toContain((en.faq as { items: Record<string, { q: string }> }).items.whatIsBis.q);
  });

  it('leaks no raw keys, undefined, or stringified objects', () => {
    for (const pack of [enPack, esPack]) {
      expect(pack).not.toContain('undefined');
      expect(pack).not.toContain('[object Object]');
      expect(pack).not.toMatch(/faq\.items\./);
      expect(pack).not.toMatch(/capabilities\.groups\./);
    }
  });

  it('stays within the per-locale budget', () => {
    expect(enPack.length).toBeLessThanOrEqual(PACK_MAX_CHARS);
    expect(esPack.length).toBeLessThanOrEqual(PACK_MAX_CHARS);
  });

  it('keeps EN and ES within 25% of each other', () => {
    const ratio = Math.abs(enPack.length - esPack.length) / Math.max(enPack.length, esPack.length);
    expect(ratio).toBeLessThan(0.25);
  });

  it('throws a named error when a required key is missing', () => {
    const broken = JSON.parse(JSON.stringify(en)) as Record<string, unknown>;
    delete (broken.howWeWork as Record<string, unknown>).pricingBody;
    expect(() => buildSiteContext({ locale: 'en', messages: broken, posts })).toThrow(/howWeWork\.pricingBody/);
  });

  it('throws when a required list key is not an array of strings', () => {
    const broken = JSON.parse(JSON.stringify(en)) as Record<string, unknown>;
    (broken.services as Record<string, unknown>).g1Bullets = 'not a list';
    expect(() => buildSiteContext({ locale: 'en', messages: broken, posts })).toThrow(/services\.g1Bullets/);
  });
});

/**
 * Guard against the failure mode this fix targets: the pack reads numbered
 * key families (services.g<N>Title, about.cred<N>Title, about.m<N>Title,
 * howWeWork.step<N>Title, resources.items.<slug>.point<N>) over hardcoded
 * ranges. If a message file ever goes past what the builder consumes — e.g.
 * someone adds `services.g4Title` without bumping SERVICE_GROUP_IDS — the
 * pack silently omits the new content, and (for resources specifically) a
 * *shrunk* count makes `pick` throw and fail the pack for every visitor.
 * Both directions are real bugs, and this test catches either: it asserts
 * the highest N actually present in messages/{locale}.json equals the count
 * the builder consumes, so drift between "what exists" and "what's read"
 * fails loudly here instead of shipping silently.
 */
describe('numbered-key families stay in sync with what the pack consumes', () => {
  function maxNumberedKey(dict: Record<string, unknown> | undefined, prefix: string, suffix: string): number {
    if (!dict) return 0;
    const re = new RegExp(`^${prefix}(\\d+)${suffix}$`);
    let max = 0;
    for (const key of Object.keys(dict)) {
      const match = re.exec(key);
      if (match) max = Math.max(max, Number(match[1]));
    }
    return max;
  }

  for (const [label, dict] of [['en', en], ['es', es]] as const) {
    it(`${label}.json: services.g<N>Title tops out at what SERVICE_GROUP_IDS consumes`, () => {
      const highest = maxNumberedKey(dict.services as Record<string, unknown>, 'g', 'Title');
      expect(
        highest,
        `messages/${label}.json has services.g${highest}Title, but the pack only reads ${SERVICE_GROUP_IDS.join(', ')} — bump SERVICE_GROUP_IDS in site-context.ts to consume it`,
      ).toBe(SERVICE_GROUP_IDS.length);
    });

    it(`${label}.json: about.cred<N>Title tops out at CREDENTIAL_COUNT`, () => {
      const highest = maxNumberedKey(dict.about as Record<string, unknown>, 'cred', 'Title');
      expect(
        highest,
        `messages/${label}.json has about.cred${highest}Title, but the pack only reads CREDENTIAL_COUNT=${CREDENTIAL_COUNT} — bump CREDENTIAL_COUNT in site-context.ts to consume it`,
      ).toBe(CREDENTIAL_COUNT);
    });

    it(`${label}.json: about.m<N>Title tops out at METHOD_COUNT`, () => {
      const highest = maxNumberedKey(dict.about as Record<string, unknown>, 'm', 'Title');
      expect(
        highest,
        `messages/${label}.json has about.m${highest}Title, but the pack only reads METHOD_COUNT=${METHOD_COUNT} — bump METHOD_COUNT in site-context.ts to consume it`,
      ).toBe(METHOD_COUNT);
    });

    it(`${label}.json: howWeWork.step<N>Title tops out at PROCESS_STEP_COUNT`, () => {
      const highest = maxNumberedKey(dict.howWeWork as Record<string, unknown>, 'step', 'Title');
      expect(
        highest,
        `messages/${label}.json has howWeWork.step${highest}Title, but the pack only reads PROCESS_STEP_COUNT=${PROCESS_STEP_COUNT} — bump PROCESS_STEP_COUNT in site-context.ts to consume it`,
      ).toBe(PROCESS_STEP_COUNT);
    });

    it(`${label}.json: every resource's point<N> tops out at RESOURCE_POINT_COUNT`, () => {
      const items = (dict.resources as { items: Record<string, Record<string, unknown>> }).items;
      for (const r of resources) {
        const highest = maxNumberedKey(items[r.slug], 'point', '');
        expect(
          highest,
          `messages/${label}.json resources.items.${r.slug} has point${highest}, but the pack only reads RESOURCE_POINT_COUNT=${RESOURCE_POINT_COUNT} — bump RESOURCE_POINT_COUNT in site-context.ts to consume it (and note: fewer points than RESOURCE_POINT_COUNT makes buildSiteContext throw for every visitor)`,
        ).toBe(RESOURCE_POINT_COUNT);
      }
    });
  }
});
