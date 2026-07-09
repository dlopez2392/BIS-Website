import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/seo/business';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;
const PATHS = ['', '/services', '/industries', '/about', '/contact'];

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    PATHS.map((p) => ({
      url: `${BASE}/${locale}${p}`,
      changeFrequency: 'monthly' as const,
      priority: p === '' ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${BASE}/${l}${p}`])),
      },
    }))
  );
}
