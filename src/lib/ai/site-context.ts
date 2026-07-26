import { business } from '@/lib/seo/business';
import { faqCategories } from '@/lib/faq';
import { capabilityGroups, expertiseIds } from '@/lib/tech/capabilities';
import { resources } from '@/lib/resources';
import { listPosts, sortByDateDesc, type PostMeta } from '@/lib/insights';
import type { Locale } from '@/lib/ai/visitor-context';

/**
 * Per-locale ceiling for the pack. Measured at introduction: EN 14,117 chars,
 * ES 15,328 (Spanish runs longer). The cap leaves both real headroom while
 * still failing a test if content growth runs away.
 *
 * Section headings and connectives in this file ("## Business", "Q:", "Read
 * at") are deliberately English in both packs: they are delimiters the model
 * parses, never text a visitor sees. Visitor-facing copy always comes from
 * messages/{locale}.json.
 */
export const PACK_MAX_CHARS = 24_000;

/**
 * Numbered-key families the pack consumes. These are the single source of
 * truth for "how many": the builder below reads exactly these, and the guard
 * test in __tests__/site-context.test.ts scans the real message files and
 * fails loudly if a message file has gone past what's listed here (e.g. a
 * `services.g4Title` added without also bumping `SERVICE_GROUP_IDS`). Bump
 * these deliberately when content grows — that is the intended way to opt a
 * new group/credential/method/step/point into the pack.
 */
export const SERVICE_GROUP_IDS = ['g1', 'g2', 'g3'] as const;
export const CREDENTIAL_COUNT = 8;
export const METHOD_COUNT = 4;
export const PROCESS_STEP_COUNT = 4;
export const RESOURCE_POINT_COUNT = 3;

export interface SiteContextInput {
  locale: Locale;
  messages: Record<string, unknown>;
  posts: PostMeta[];
}

type Dict = Record<string, unknown>;

/** Page path → what the model should expect to find there. Model-facing only, so intentionally English in both packs. */
const PAGE_MAP: ReadonlyArray<readonly [string, string]> = [
  ['', 'home: overview, platforms marquee, latest posts'],
  ['/services', 'the three service groups in detail'],
  ['/industries', 'the five industries served'],
  ['/about', 'founder background and credentials'],
  ['/how-we-work', 'the four-step process and how pricing works'],
  ['/capabilities', 'the full technology inventory and areas of expertise'],
  ['/faq', 'frequently asked questions'],
  ['/service-area', 'the Rio Grande Valley cities served'],
  ['/insights', 'the article index'],
  ['/resources', 'free downloadable resources'],
  ['/contact', 'contact form plus the scheduler for booking a free assessment'],
  ['/privacy', 'privacy policy: what is collected and which processors are used'],
];

function pick(messages: Dict, dotted: string): string {
  const value = dotted.split('.').reduce<unknown>((acc, key) => (acc as Dict | undefined)?.[key], messages);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`site-context: missing or non-string i18n key "${dotted}"`);
  }
  return value;
}

function pickList(messages: Dict, dotted: string): string[] {
  const value = dotted.split('.').reduce<unknown>((acc, key) => (acc as Dict | undefined)?.[key], messages);
  if (!Array.isArray(value) || value.length === 0 || value.some((v) => typeof v !== 'string')) {
    throw new Error(`site-context: i18n key "${dotted}" is not a non-empty string array`);
  }
  return value as string[];
}

/**
 * Assembles the per-locale reference pack injected into the system prompt.
 * Pure: no fs, no network, no MDX — everything arrives via `input`.
 */
export function buildSiteContext({ locale, messages, posts }: SiteContextInput): string {
  const m = (key: string) => pick(messages, key);
  const list = (key: string) => pickList(messages, key);
  const url = (p: string) => `${business.url}/${locale}${p}`;
  const out: string[] = [];

  out.push('## Business');
  out.push(
    `${business.name} (BIS). Founder: ${business.founder}. Email: ${business.email}. ` +
      `Based in ${business.address.locality}, ${business.address.region}. ` +
      `Works in: ${business.languages.join(' and ')}. ` +
      `Areas served: ${business.areaServed.join(', ')}.`,
  );

  out.push(`\n## Services (detail: ${url('/services')})`);
  for (const g of SERVICE_GROUP_IDS) {
    out.push(
      `- ${m(`services.${g}Title`)} — ${m(`services.${g}Body`)} ` +
        `Proof: ${m(`services.${g}Proof`)} Includes: ${list(`services.${g}Bullets`).join('; ')}`,
    );
  }

  out.push(`\n## Industries (detail: ${url('/industries')})`);
  for (const i of ['legal', 'med', 'log', 'trades', 'ag'] as const) {
    out.push(`- ${m(`industries.${i}Title`)} (${m(`industries.${i}Label`)}) — ${m(`industries.${i}Body`)}`);
  }

  out.push(`\n## Founder, credentials, method (detail: ${url('/about')})`);
  out.push(m('about.founderBio'));
  for (let n = 1; n <= CREDENTIAL_COUNT; n++) out.push(`- ${m(`about.cred${n}Title`)}: ${m(`about.cred${n}Body`)}`);
  for (let n = 1; n <= METHOD_COUNT; n++) out.push(`- Method — ${m(`about.m${n}Title`)}: ${m(`about.m${n}Body`)}`);

  out.push(`\n## FAQ (full page: ${url('/faq')})`);
  for (const category of faqCategories) {
    out.push(`### ${m(`faq.categories.${category.id}`)}`);
    for (const id of category.items) {
      out.push(`Q: ${m(`faq.items.${id}.q`)}`);
      out.push(`A: ${m(`faq.items.${id}.a`)}`);
    }
  }

  out.push(`\n## How engagements work (full page: ${url('/how-we-work')})`);
  out.push(m('howWeWork.intro'));
  for (let n = 1; n <= PROCESS_STEP_COUNT; n++) out.push(`${n}. ${m(`howWeWork.step${n}Title`)}: ${m(`howWeWork.step${n}Body`)}`);
  out.push(`${m('howWeWork.pricingHeading')}: ${m('howWeWork.pricingBody')}`);
  out.push(`${m('howWeWork.expectHeading')}: ${m('howWeWork.expectBody')}`);

  out.push(`\n## Service area (full page: ${url('/service-area')})`);
  out.push(m('serviceArea.intro'));
  out.push(`${m('serviceArea.whyLocalHeading')}: ${m('serviceArea.whyLocalBody')}`);

  out.push(`\n## Platforms and tools worked with (full page: ${url('/capabilities')})`);
  for (const group of capabilityGroups) {
    out.push(`- ${m(`capabilities.groups.${group.id}`)}: ${group.items.join(', ')}`);
  }
  out.push(
    `${m('capabilities.expertiseHeading')}: ${expertiseIds.map((id) => m(`capabilities.expertise.${id}`)).join(', ')}`,
  );

  out.push(`\n## Free resources (library: ${url('/resources')})`);
  for (const r of resources) {
    out.push(
      `- ${m(`resources.items.${r.slug}.title`)} — ${m(`resources.items.${r.slug}.blurb`)} ` +
        `Inside: ${Array.from({ length: RESOURCE_POINT_COUNT }, (_, i) => m(`resources.items.${r.slug}.point${i + 1}`)).join('; ')}. ` +
        `Get it at ${url(`/resources/${r.slug}`)}`,
    );
  }

  out.push(`\n## Articles (index: ${url('/insights')})`);
  if (posts.length === 0) {
    out.push('No articles published yet.');
  } else {
    for (const p of sortByDateDesc(posts)) {
      out.push(
        `- "${p.title}" (${p.category}, ${p.date}, ${p.readingMinutes} min read) — ${p.description} ` +
          `Read at ${url(`/insights/${p.slug}`)}`,
      );
    }
  }

  out.push('\n## Page map (link using these exact URLs)');
  for (const [p, what] of PAGE_MAP) out.push(`- ${url(p)} — ${what}`);

  return out.join('\n');
}

type CacheEntry = { ok: true; pack: string } | { ok: false; error: unknown };
const cache = new Map<Locale, CacheEntry>();

// listPosts() returns [] on a missing/unreadable content directory rather
// than throwing, so an empty pack section can happen without the try/catch
// below ever firing. Warn once per locale so a content/deploy regression
// (the assistant confidently saying "no articles" while /insights shows two)
// leaves a signal instead of failing silently.
const emptyPostsWarned = new Set<Locale>();
function warnEmptyPostsOnce(locale: Locale) {
  if (emptyPostsWarned.has(locale)) return;
  emptyPostsWarned.add(locale);
  console.warn(`[site-context] no posts found for locale "${locale}"; pack will say "No articles published yet."`);
}

/**
 * Loads the pack for a locale, memoised per lambda instance. Called at request
 * time only — never at module scope — because route handlers are eagerly
 * evaluated during `next build` page-data collection.
 *
 * Caches failures too (as a sentinel, re-thrown on every subsequent call)
 * so a broken pack costs one build per instance, not one per request — the
 * route's own log-once fallback already suppresses repeat logging, but
 * without this every request would still pay for a full rebuild-and-throw.
 */
export async function getSiteContext(locale: Locale): Promise<string> {
  const cached = cache.get(locale);
  if (cached) {
    if (cached.ok) return cached.pack;
    throw cached.error;
  }

  try {
    const [messagesModule, posts] = await Promise.all([
      // Same variable-dynamic-import pattern as src/i18n/request.ts, which the
      // bundler already resolves for messages/{locale}.json.
      import(`../../../messages/${locale}.json`) as Promise<{ default: Record<string, unknown> }>,
      listPosts(locale),
    ]);
    if (posts.length === 0) warnEmptyPostsOnce(locale);

    const pack = buildSiteContext({ locale, messages: messagesModule.default, posts });
    cache.set(locale, { ok: true, pack });
    return pack;
  } catch (error) {
    cache.set(locale, { ok: false, error });
    throw error;
  }
}

/** Test-only: clears the memoisation cache and the empty-posts warn-once guard. */
export function __resetSiteContextCache(): void {
  cache.clear();
  emptyPostsWarned.clear();
}
