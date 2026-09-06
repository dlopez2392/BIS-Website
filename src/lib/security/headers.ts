/**
 * Response headers for every route.
 *
 * The site had none before this: no Content-Security-Policy, no HSTS, no
 * clickjacking or MIME-sniffing defences. For a company whose second service
 * line is security, the first thing a prospect scans is us — so the posture
 * here is the one BIS would recommend to a client, and the comments say why
 * each allowance exists rather than leaving a future reader to guess.
 *
 * The CSP is deliberately not nonce-based. A nonce has to be minted per
 * request, which would force all 61 statically generated pages to render
 * dynamically — a real cost in speed and cache hit rate, paid to harden inline
 * scripts that Next.js itself emits (its hydration bootstrap and the
 * next-themes flash-guard). Everything else is closed: no external script
 * origin, no plugins, no framing, no form posts off-site.
 */

/**
 * Mirror of `PLATFORM_ORIGIN` in `src/lib/platform.ts`.
 *
 * `next.config.ts` is loaded outside the app's module graph and its path
 * aliases, so importing the real constant would drag next-intl's routing into
 * the config loader. The two are kept in lockstep by a test in
 * `headers.test.ts` that fails if either the default or the env var name
 * drifts, so this copy cannot silently go stale.
 */
function platformOrigin(): string {
  return (process.env.NEXT_PUBLIC_BIS_PLATFORM_ORIGIN ?? 'https://app.bis-rgv.com').replace(/\/+$/, '');
}

/** Vercel Analytics and Speed Insights, which self-host in production and fall back to this host elsewhere. */
const VERCEL_SCRIPTS = 'https://va.vercel-scripts.com';
const VERCEL_VITALS = 'https://vitals.vercel-insights.com';
const OPENAI_REALTIME = 'https://api.openai.com';

export function contentSecurityPolicy({ dev = false }: { dev?: boolean } = {}): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // Inline scripts are Next.js's own hydration payload and the theme
    // flash-guard; see the note above on why a nonce is the wrong trade here.
    // 'unsafe-eval' is the dev bundler's hot reload and never ships.
    'script-src': ["'self'", "'unsafe-inline'", VERCEL_SCRIPTS, ...(dev ? ["'unsafe-eval'"] : [])],
    // Tailwind and next/font both write a <style> element into the document.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    // The hero backdrop, served from /public/hero.
    'media-src': ["'self'"],
    // Chat and every server action are same-origin; the rest is analytics.
    // OPENAI_REALTIME is the SDP exchange that opens the voice session: the
    // browser POSTs its WebRTC offer straight to OpenAI carrying a
    // one-session ephemeral key, so the audio never transits this site. The
    // platform origin is where that key is minted. Media itself rides
    // WebRTC's own transport, which CSP does not govern.
    'connect-src': [
      "'self'", VERCEL_SCRIPTS, VERCEL_VITALS, OPENAI_REALTIME, platformOrigin(),
      ...(dev ? ['ws:'] : []),
    ],
    // The contact page frames the BIS Platform's own form and scheduler.
    'frame-src': [platformOrigin()],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    // Nothing on this site is a plugin, an <object>, or a framing target, and
    // no form on it posts anywhere but back to this origin.
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`);
  // Not sent in dev: the dev server is http://localhost and the directive
  // would rewrite its own asset requests to https.
  if (!dev) parts.push('upgrade-insecure-requests');
  return parts.join('; ');
}

/**
 * Features this site does not use are turned off at the browser level.
 *
 * `microphone=(self)` — opened, as the earlier note here anticipated, by the
 * in-browser "Talk to Sofía" voice demo. `(self)` and not `*`: this site's own
 * pages may ask, and the browser still asks the visitor before any audio is
 * captured. No third party embedded in a page here can reach the microphone,
 * and `camera` stays fully denied — the demo needs a voice, never a face.
 * `browsing-topics` opts the site out of ad-interest inference, which is the
 * posture a security consultancy should hold whether or not anyone checks.
 */
const PERMISSIONS_POLICY = ['camera=()', 'microphone=(self)', 'geolocation=()', 'payment=()', 'usb=()', 'browsing-topics=()'].join(', ');

export function securityHeaders({ dev = false }: { dev?: boolean } = {}): { key: string; value: string }[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy({ dev }) },
    // Two years, subdomains included, and preload-eligible. app.bis-rgv.com is
    // HTTPS-only on Vercel too, so includeSubDomains costs nothing.
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // Referrers stay full inside the site and collapse to the bare origin when
    // leaving it, so a visitor's path never reaches a third party.
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // Belt and braces with frame-ancestors, for anything that predates CSP.
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
  ];
}
