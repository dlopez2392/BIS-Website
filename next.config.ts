import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import createMDX from '@next/mdx';
import { withBotId } from 'botid/next/config';
import { securityHeaders } from './src/lib/security/headers';

const withNextIntl = createNextIntlPlugin();
const withMDX = createMDX();

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // Every response carries the CSP and hardening headers; see
  // src/lib/security/headers.ts for what each allowance is for.
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders({ dev: process.env.NODE_ENV === 'development' }) },
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
        // Vendor logos are not versioned, so they get a day of freshness and a
        // week of serving-while-revalidating rather than an immutable cache
        // that would outlive a logo change by a year.
        source: '/logos/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
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
