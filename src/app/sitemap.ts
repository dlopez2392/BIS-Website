import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/seo/business';
import { allSlugs } from '@/lib/insights';
import { resources } from '@/lib/resources';

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
  '/insights',
  '/resources',
  '/about',
  '/contact',
  '/privacy',
];

/** Static pages plus the content routes, derived from the same data the pages render from. */
export function sitemapPaths(): string[] {
  return [
    ...STATIC_PATHS,
    ...allSlugs().map((slug) => `/insights/${slug}`),
    ...resources.map((r) => `/resources/${r.slug}`),
  ];
}

function priorityFor(path: string): number {
  if (path === '') return 1;
  if (path.split('/').length > 2) return 0.6; // an individual post or resource
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
