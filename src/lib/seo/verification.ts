import type { Metadata } from 'next';

/**
 * Search-engine ownership tokens, read from the environment so a token is never
 * committed and swapping one is an env change, not a code change.
 *
 * These pages are statically prerendered, so the tag is baked in at BUILD time:
 * setting the variable in Vercel does nothing until the next deploy. DNS
 * verification avoids that entirely and is the recommended route — see
 * docs/seo/search-console.md.
 */
export function siteVerification(
  env: Record<string, string | undefined> = process.env
): Metadata['verification'] {
  const google = env.GOOGLE_SITE_VERIFICATION?.trim();
  const bing = env.BING_SITE_VERIFICATION?.trim();
  if (!google && !bing) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { 'msvalidate.01': bing } } : {}),
  };
}
