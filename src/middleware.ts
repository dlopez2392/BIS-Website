import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { isBotIdChallengePath } from './lib/security/botid-paths';

const intlMiddleware = createMiddleware(routing);

/**
 * i18n routing, with one path family handed straight through.
 *
 * Vercel BotID's challenge is served by rewrites that `withBotId()` injects
 * into next.config, on random UUID paths at the root. Next.js runs middleware
 * BEFORE those rewrites, so the locale redirect below was rewriting the
 * challenge to `/en/<uuid>` and the browser got a 404 — silently breaking the
 * bot check on EVERY protected endpoint, which then refused real visitors as
 * unverified. Passing those requests through untouched lets the rewrite that
 * comes after middleware do its job. See lib/security/botid-paths.ts.
 */
export default function middleware(request: NextRequest) {
  if (isBotIdChallengePath(request.nextUrl.pathname)) return NextResponse.next();
  return intlMiddleware(request);
}

export const config = {
  // `apple-icon` and `icon` are excluded for the same reason `og` is: they are
  // dotless metadata routes, so the catch-all would locale-redirect them and
  // iOS would follow /apple-icon -> /en/apple-icon straight into a 404.
  // Anything with an extension (icon.svg, sitemap.xml, robots.txt) is already
  // covered by the `.*\..*` clause.
  //
  // BotID's challenge paths are NOT excluded here, deliberately: their
  // segments are random UUIDs by design, so a static matcher cannot name them
  // without encoding the shape twice. The function above skips them instead,
  // where the rule is one tested predicate.
  matcher: ['/', '/(en|es)/:path*', '/((?!api|og|apple-icon|icon|_next|_vercel|.*\\..*).*)'],
};
