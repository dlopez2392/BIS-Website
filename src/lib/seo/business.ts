export const business = {
  name: 'Bespoke Intelligent Solutions',
  url: 'https://bis-rgv.com',
  email: 'bespokeintelligentsolutions@gmail.com',
  // PLACEHOLDER — replace with the real business number before launch.
  phone: '+1-956-000-0000',
  address: { locality: 'Harlingen', region: 'TX', country: 'US' },
  areaServed: [
    'Rio Grande Valley', 'Harlingen', 'McAllen', 'Brownsville', 'Edinburg', 'Weslaco',
    'Mission', 'Pharr', 'San Benito', 'La Feria', 'Los Fresnos', 'San Juan', 'Alamo', 'Raymondville',
  ],
  founder: 'Dan Lopez',
  languages: ['English', 'Spanish'],
  sameAs: [] as string[], // add LinkedIn URL when available
} as const;

export const SITE_URL = business.url;
