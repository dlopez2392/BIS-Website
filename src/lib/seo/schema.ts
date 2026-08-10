import { business, SITE_URL } from './business';

/**
 * One stable identifier for the business entity, reused by every schema that
 * refers to it (article publisher, service provider). Search engines merge the
 * facts under this @id instead of guessing that three descriptions are the same
 * company.
 */
export const BUSINESS_ID = `${SITE_URL}/#business`;

/** The site's branded OG image, which doubles as the schema `image`. */
export function ogImageUrl(title: string): string {
  return `${SITE_URL}/og?title=${encodeURIComponent(title)}`;
}

export function absoluteUrl(locale: string, path: string): string {
  return `${SITE_URL}/${locale}${path === '/' ? '' : path}`;
}

export interface ServiceOffer {
  name: string;
  description: string;
}

/**
 * The business entity, emitted on every page. `description` and `services` are
 * passed in already translated — the schema on an ES page should not describe
 * the company in English.
 */
export function businessSchema({
  locale,
  description,
  services = [],
}: {
  locale: string;
  description: string;
  services?: ServiceOffer[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': BUSINESS_ID,
    name: business.name,
    url: absoluteUrl(locale, '/'),
    email: business.email,
    telephone: business.phone,
    description,
    inLanguage: locale,
    image: ogImageUrl(business.name),
    // Served by the app/icon.svg metadata file. SVG is an accepted logo format
    // and scales for every surface that asks for one.
    logo: `${SITE_URL}/icon.svg`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.address.locality,
      addressRegion: business.address.region,
      addressCountry: business.address.country,
    },
    areaServed: business.areaServed.map((name) => ({ '@type': 'Place', name })),
    availableLanguage: business.languages,
    founder: { '@type': 'Person', name: business.founder },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: business.phone,
      email: business.email,
      availableLanguage: business.languages,
    },
    ...(services.length > 0
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: business.name,
            itemListElement: services.map((s) => ({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: s.name,
                description: s.description,
                provider: { '@id': BUSINESS_ID },
                areaServed: business.areaServed.map((name) => ({ '@type': 'Place', name })),
              },
            })),
          },
        }
      : {}),
    ...(business.sameAs.length > 0 ? { sameAs: business.sameAs } : {}),
  };
}

/** Google truncates a headline past this, so a longer one is a content bug, not a rendering one. */
export const MAX_HEADLINE = 110;

export function articleSchema({
  locale,
  slug,
  title,
  description,
  date,
  category,
}: {
  locale: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
}) {
  const url = absoluteUrl(locale, `/insights/${slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: title,
    description,
    inLanguage: locale,
    datePublished: date,
    dateModified: date,
    articleSection: category,
    image: ogImageUrl(title),
    author: { '@type': 'Person', name: business.founder, url: absoluteUrl(locale, '/about') },
    publisher: { '@id': BUSINESS_ID },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbSchema({ locale, trail }: { locale: string; trail: Crumb[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(locale, crumb.path),
    })),
  };
}
