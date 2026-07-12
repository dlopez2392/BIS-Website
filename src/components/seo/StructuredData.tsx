import { business } from '@/lib/seo/business';
import { capabilityGroups } from '@/lib/tech/capabilities';

export function StructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: business.name,
    url: business.url,
    email: business.email,
    telephone: business.phone,
    description:
      'Enterprise-grade AI adoption, IT security, and modern bilingual web design for Rio Grande Valley businesses.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.address.locality,
      addressRegion: business.address.region,
      addressCountry: business.address.country,
    },
    areaServed: business.areaServed,
    availableLanguage: business.languages,
    knowsAbout: capabilityGroups.flatMap((g) => g.items),
    founder: { '@type': 'Person', name: business.founder },
    ...(business.sameAs.length > 0 ? { sameAs: business.sameAs } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
