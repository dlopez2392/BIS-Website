import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // `apple-icon` and `icon` are excluded for the same reason `og` is: they are
  // dotless metadata routes, so the catch-all would locale-redirect them and
  // iOS would follow /apple-icon -> /en/apple-icon straight into a 404.
  // Anything with an extension (icon.svg, sitemap.xml, robots.txt) is already
  // covered by the `.*\..*` clause.
  matcher: ['/', '/(en|es)/:path*', '/((?!api|og|apple-icon|icon|_next|_vercel|.*\\..*).*)'],
};
