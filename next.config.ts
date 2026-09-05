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
    return [{ source: '/:path*', headers: securityHeaders({ dev: process.env.NODE_ENV === 'development' }) }];
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
