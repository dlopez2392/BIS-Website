import type { MetadataRoute } from 'next';

/**
 * The install surface: what Android and Chrome show when a visitor adds the
 * site to a home screen, and what a browser reads for the name and colours.
 * The 512px mark already exists as a route; a manifest may list one file at
 * two sizes.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bespoke Intelligent Solutions',
    short_name: 'BIS',
    description: 'A CRM built for Rio Grande Valley businesses, and the IT team behind it.',
    start_url: '/en',
    display: 'standalone',
    background_color: '#0b0a18',
    theme_color: '#7c3aed',
    icons: [
      { src: '/brand/mark.png', sizes: '512x512', type: 'image/png' },
      { src: '/brand/mark.png', sizes: '192x192', type: 'image/png' },
    ],
  };
}
