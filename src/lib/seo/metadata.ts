import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { SITE_URL, business } from './business';

/** Open Graph wants a language AND a region (`es_US`), not the bare route
 *  locale: Facebook ignores `es` and falls back to `en_US`. Both audiences
 *  are in the US, so the region is US for both. */
const OG_LOCALE: Record<string, string> = { en: 'en_US', es: 'es_US' };

export function pageMetadata({
  locale, path, title, description, absoluteTitle = false,
}: {
  locale: string; path: string; title: string; description: string;
  /** Skip the layout's " · BIS" template: the home page's title is the full brand name. */
  absoluteTitle?: boolean;
}): Metadata {
  const seg = path === '/' ? '' : path;
  const canonical = `${SITE_URL}/${locale}${seg}`;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}${seg}`;
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${seg}`;
  const ogImage = `${SITE_URL}/og?title=${encodeURIComponent(title)}&locale=${locale}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title, description, url: canonical, siteName: business.name,
      locale: OG_LOCALE[locale] ?? 'en_US',
      alternateLocale: Object.entries(OG_LOCALE).filter(([l]) => l !== locale).map(([, v]) => v),
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, type: 'image/jpeg' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}
