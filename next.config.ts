import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Canonicalize www -> apex (301) so bis-rgv.com is the single origin
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

export default withNextIntl(nextConfig);
