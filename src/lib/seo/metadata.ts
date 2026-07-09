import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { SITE_URL, business } from './business';

export function pageMetadata({
  locale, path, title, description,
}: { locale: string; path: string; title: string; description: string }): Metadata {
  const seg = path === '/' ? '' : path;
  const canonical = `${SITE_URL}/${locale}${seg}`;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}${seg}`;
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${seg}`;
  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title, description, url: canonical, siteName: business.name,
      locale, type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}
