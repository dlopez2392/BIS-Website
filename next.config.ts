import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import createMDX from '@next/mdx';
import { withBotId } from 'botid/next/config';
import { securityHeaders } from './src/lib/security/headers';
import { NON_BOTID_PATH_SOURCE } from './src/lib/security/botid-paths';

const withNextIntl = createNextIntlPlugin();
const withMDX = createMDX();

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    // Next's default is ['image/webp'] alone, so a browser advertising AVIF
    // was still served WebP — verified against production before changing
    // this. AVIF is listed first because the list is a preference order and
    // Next serves the first entry the browser accepts, falling back to WebP
    // and then the original for anything that does not.
    //
    // It matters most on the /platform captures: those are 2560x1600 PNGs of
    // a dark UI, the case AVIF handles far better than WebP, and they now
    // appear on the homepage, /work and every industry page.
    formats: ['image/avif', 'image/webp'],
  },
  // Every response carries the CSP and hardening headers; see
  // src/lib/security/headers.ts for what each allowance is for.
  async headers() {
    return [
      // Everything except CSP, on every path. None of these constrain what a
      // document may execute, so they are safe on responses this site proxies
      // but does not own.
      {
        source: '/:path*',
        headers: securityHeaders({ dev: process.env.NODE_ENV === 'development', csp: false }),
      },
      {
        // CSP, on every path EXCEPT BotID's proxied challenge. Kasada's
        // anti-bot code cannot run under this site's script-src, and it failed
        // silently — challenge never solved, every protected endpoint refusing
        // real visitors with a 403. Widening script-src site-wide to
        // accommodate code this site does not own would be strictly worse.
        source: NON_BOTID_PATH_SOURCE,
        headers: securityHeaders({ dev: process.env.NODE_ENV === 'development' })
          .filter((h) => h.key === 'Content-Security-Policy'),
      },
      {
        // Files under /public are served with `max-age=0, must-revalidate` by
        // default, so every returning desktop visitor made a round trip to
        // revalidate a 3 MB video while the JS beside it was cached for a
        // year. These names carry a version, so the URL changes when the
        // footage does and an immutable cache can never serve stale bytes.
        source: '/hero/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Same contract as /hero: art files carry a version in the name, so
        // they are immutable for a year and a change is a new URL.
        source: '/art/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  async redirects() {
    return [
      // Canonicalize www -> apex (308, permanent) so bis-rgv.com is the single origin
      // and duplicate-content signals don't split between the two hosts.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.bis-rgv.com' }],
        destination: 'https://bis-rgv.com/:path*',
        permanent: true,
      },
    ];
  },
};

// withBotId outermost: it adds the rewrites that serve BotID's challenge from
// this origin rather than a third-party host, which is also what keeps the
// Content-Security-Policy free of another script source.
export default withBotId(withMDX(withNextIntl(nextConfig)));
