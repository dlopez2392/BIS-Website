import { llmsTxt } from '@/lib/discovery/llms';
import { SITE_URL } from '@/lib/seo/business';

export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  const body = await llmsTxt({ siteUrl: process.env.NEXT_PUBLIC_SITE_URL || SITE_URL });
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate' },
  });
}
