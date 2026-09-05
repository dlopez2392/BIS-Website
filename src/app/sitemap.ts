import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/seo/business';
import { allSlugs } from '@/lib/insights';
import { resources } from '@/lib/resources';
import { cityPages } from '@/lib/cities';
import { industryPages } from '@/lib/industries';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;

/**
 * Every static page under `src/app/[locale]`. This list is hand-kept, so
 * sitemap.test.ts reads the route directories off disk and fails if a page is
 * added without landing here — which is exactly how /how-we-work, /capabilities,
 * /faq, /service-area, /resources, /privacy and /insights all went unlisted.
 */
export const STATIC_PATHS = [
  '',
  '/services',
  '/industries',
  '/work',
  '/how-we-work',
  '/capabilities',
  '/service-area',
  '/faq',
  '/tools/security-check',
  '/tools/first-hour-back',
  '/insights',
  '/resources',
  '/about',
  '/contact',
  '/privacy',
  '/accessibility',
];

/** Static pages plus the content routes, derived from the same data the pages render from. */
export function sitemapPaths(): string[] {
  return [
    ...STATIC_PATHS,
    ...allSlugs().map((slug) => `/insights/${slug}`),
    ...resources.map((r) => `/resources/${r.slug}`),
    ...cityPages.map((c) => `/service-area/${c.id}`),
    ...industryPages.map((i) => `/industries/${i.id}`),
  ];
}

// An industry page is a landing page BIS wants found, so it is deliberately
// NOT in this list: these prefixes mark one-of-many content items.
const CONTENT_PREFIXES = ['/insights/', '/resources/', '/service-area/'];

function priorityFor(path: string): number {
  if (path === '') return 1;
  // A nested path is not automatically a minor one: /tools/security-check is a
  // landing page BIS wants found, while /insights/<slug> is one article.
  if (CONTENT_PREFIXES.some((prefix) => path.startsWith(prefix))) return 0.6;
  return 0.8;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = sitemapPaths();
  return routing.locales.flatMap((locale) =>
    paths.map((p) => ({
      url: `${BASE}/${locale}${p}`,
      changeFrequency: 'monthly' as const,
      priority: priorityFor(p),
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${BASE}/${l}${p}`])),
      },
    }))
  );
}
