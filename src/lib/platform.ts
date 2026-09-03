import { routing } from '@/i18n/routing';

/**
 * The BIS Platform (app.bis-rgv.com) hosts this site's contact form and its
 * assessment scheduler. Both used to be third parties: the form posted to a
 * Neon table through Resend, the scheduler was a Cal.com embed. The platform
 * is the product BIS sells, so the agency's own site is its first client —
 * every lead lands in the same CRM, conversation thread and calendar a
 * customer's would, and one fewer vendor holds a copy of a visitor's details.
 *
 * The platform's own embed contract is `GET /embed.js` (a `<script>` tag that
 * injects an iframe). This site is React, so `PlatformEmbed` builds the same
 * iframe itself rather than injecting a script whose `document.currentScript`
 * insertion point would land wherever `next/script` mounts it. Everything
 * below mirrors that script exactly — the URL shape, the attribution keys it
 * lifts off the host page, and the postMessage protocol — so a change on the
 * platform side is a change here too.
 *
 * The public ids are opaque tokens, not secrets: a published form and an
 * enabled calendar are meant to be reachable by link. Defaults are the live
 * BIS account's; the env vars exist so a preview can point at a test account.
 */
export type Locale = (typeof routing.locales)[number];

export const PLATFORM_ORIGIN = (process.env.NEXT_PUBLIC_BIS_PLATFORM_ORIGIN ?? 'https://app.bis-rgv.com').replace(/\/+$/, '');

/** One calendar per account on the platform; the language is a query param. */
export const BOOKING_PUBLIC_ID = process.env.NEXT_PUBLIC_BIS_BOOKING_ID ?? '7t36x3a3izen';

/**
 * One form per language. A platform form's field labels are single strings,
 * so a bilingual site needs two forms — the platform-native way a bilingual
 * client would do it, not a workaround.
 */
export const FORM_PUBLIC_IDS: Record<Locale, string> = {
  en: process.env.NEXT_PUBLIC_BIS_FORM_ID_EN ?? 'i994hbegzxng',
  es: process.env.NEXT_PUBLIC_BIS_FORM_ID_ES ?? 'yqj4fywpjptn',
};

export type EmbedKind = 'form' | 'booking';
export type HostTheme = 'light' | 'dark';

/** The same allow-list `embed.js` lifts off the host page, in the same order. */
export const ATTRIBUTION_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid',
] as const;

function publicId(kind: EmbedKind, locale: Locale): string {
  return kind === 'form' ? FORM_PUBLIC_IDS[locale] : BOOKING_PUBLIC_ID;
}

function pathFor(kind: EmbedKind, locale: Locale): string {
  return `${PLATFORM_ORIGIN}/${kind === 'form' ? 'f' : 'b'}/${encodeURIComponent(publicId(kind, locale))}`;
}

/** The bare hosted page, for the "open in a new tab" fallback under each embed. */
export function publicPageUrl(kind: EmbedKind, locale: Locale): string {
  return `${pathFor(kind, locale)}?locale=${locale}`;
}

export interface EmbedUrlInput {
  kind: EmbedKind;
  locale: Locale;
  theme: HostTheme;
  /** `window.location.href` of the host page — where the iframe cannot see. */
  hostHref: string;
  /** `document.referrer` of the host page. */
  referrer: string;
}

/**
 * The iframe `src`, built the way `embed.js` builds it: locale and theme as
 * hints, utm_* and click ids lifted off the HOST url (the iframe's own url is
 * the platform's, so it can never see them), then the host page url and its
 * referrer so the lead's attribution records where it actually came from.
 */
export function embedUrl({ kind, locale, theme, hostHref, referrer }: EmbedUrlInput): string {
  const params = new URLSearchParams();
  params.set('locale', locale);
  params.set('theme', theme);
  let host: URL | null = null;
  try {
    host = new URL(hostHref);
  } catch {
    host = null;
  }
  if (host) {
    for (const key of ATTRIBUTION_KEYS) {
      const value = host.searchParams.get(key);
      if (value) params.set(key, value);
    }
    params.set('page', host.href);
  }
  if (referrer) params.set('ref', referrer);
  return `${pathFor(kind, locale)}?${params.toString()}`;
}

export type EmbedMessage =
  | { type: 'height'; height: number }
  | { type: 'redirect'; url: string }
  | { type: 'submitted'; kind: EmbedKind };

function isHttpUrl(url: string): boolean {
  try {
    const scheme = new URL(url, 'https://bis-rgv.com/').protocol;
    return scheme === 'http:' || scheme === 'https:';
  } catch {
    return false;
  }
}

/**
 * Decodes a `postMessage` payload from the embedded page. The caller has
 * already checked `event.source` and `event.origin`; this checks the SHAPE,
 * because a message that passed both is still data, not an instruction — a
 * redirect to anything but http(s) is dropped exactly as `embed.js` drops it.
 */
export function parseEmbedMessage(data: unknown): EmbedMessage | null {
  if (!data || typeof data !== 'object') return null;
  const { type, height, url } = data as { type?: unknown; height?: unknown; url?: unknown };
  if (type === 'bis-form-height' && typeof height === 'number' && Number.isFinite(height) && height > 0) {
    return { type: 'height', height };
  }
  if (type === 'bis-form-redirect' && typeof url === 'string' && isHttpUrl(url)) {
    return { type: 'redirect', url };
  }
  if (type === 'bis-form-submitted') return { type: 'submitted', kind: 'form' };
  if (type === 'bis-booking-submitted') return { type: 'submitted', kind: 'booking' };
  return null;
}
