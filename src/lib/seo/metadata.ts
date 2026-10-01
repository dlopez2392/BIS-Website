import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { SITE_URL, business } from './business';

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
      locale, type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}
