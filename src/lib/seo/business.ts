export const business = {
  name: 'Bespoke Intelligent Solutions',
  url: 'https://bis-rgv.com',
  email: 'bespokeintelligentsolutions@gmail.com',
  // The Sofia answering-service line (Telnyx -> OpenAI SIP). Rendered for
  // humans and dialing via src/lib/phone.ts; consumed as-is by JSON-LD.
  phone: '+1-956-506-1545',
  address: { locality: 'Harlingen', region: 'TX', country: 'US' },
  areaServed: [
    'Rio Grande Valley', 'Harlingen', 'McAllen', 'Brownsville', 'Edinburg', 'Weslaco',
    'Mission', 'Pharr', 'San Benito', 'La Feria', 'Los Fresnos', 'San Juan', 'Alamo', 'Mercedes',
    'Donna', 'Raymondville',
  ],
  founder: 'Dan Lopez',
  languages: ['English', 'Spanish'],
  // Profiles that are provably the same entity as this site. The cid form is
  // the stable address of a Google listing; the /maps/place/ URL Google hands
  // you carries coordinates and a session token, so it changes on every share.
  sameAs: [
    'https://maps.google.com/?cid=8116874814655673600', // Google Business Profile (verified 2026-09)
  ] as string[], // add LinkedIn URL when available
} as const;

/**
 * `areaServed` minus the region itself — the cities we name as places we cover.
 * The one source for both the /service-area list and the count in the copy, so
 * adding a city can never leave a hard-coded number behind.
 */
export const serviceAreaCities = business.areaServed.filter((a) => a !== 'Rio Grande Valley');

export const SITE_URL = business.url;
