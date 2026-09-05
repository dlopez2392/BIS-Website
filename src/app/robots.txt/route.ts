import { robotsTxt } from '@/lib/discovery/crawlers';
import { SITE_URL } from '@/lib/seo/business';

// Next's metadata `robots.ts` cannot emit the Content-Signal line or per-agent
// blocks in the order they need to appear, so this is a plain text route.
export const dynamic = 'force-static';

export function GET(): Response {
  const body = robotsTxt({ siteUrl: process.env.NEXT_PUBLIC_SITE_URL || SITE_URL });
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate' },
  });
}
