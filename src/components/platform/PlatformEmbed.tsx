'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { track } from '@vercel/analytics';
import {
  embedUrl, parseEmbedMessage, publicPageUrl, PLATFORM_ORIGIN,
  type EmbedKind, type HostTheme, type Locale,
} from '@/lib/platform';

/**
 * Starting heights, in px. The form reports its real height over postMessage
 * the moment it renders, so its number only has to cover the first paint.
 * The booking page does not (its picker has no single natural size), so its
 * number is the height it lives at — generous enough for a week strip, a
 * slot grid and the confirm form without an inner scrollbar on most days.
 */
const START_HEIGHT: Record<EmbedKind, number> = { form: 560, booking: 640 };
const MIN_HEIGHT = 120;

// The "am I on the client yet" store: never fires, `false` on the server and
// during hydration, `true` on the first client render after mount. The iframe
// src needs `window.location` (attribution) and the theme class, neither of
// which exists server-side, and rendering a skeleton first keeps the server
// and client markup identical.
function subscribeToNothing() {
  return () => {};
}
const isClient = () => true;
const isServer = () => false;

export function PlatformEmbed({ kind }: { kind: EmbedKind }) {
  const t = useTranslations('contact');
  const locale = useLocale() as Locale;
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeToNothing, isClient, isServer);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(START_HEIGHT[kind]);

  // next-themes resolves `resolvedTheme` one effect after mount, so on the
  // very first client render it is still undefined. Its inline script has
  // already put the class on <html> by then, and that is the same answer —
  // reading it avoids painting a light embed and reloading it dark a tick
  // later for every dark-mode visitor.
  const theme: HostTheme =
    resolvedTheme === 'dark' || resolvedTheme === 'light'
      ? resolvedTheme
      : mounted && document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  const src = mounted
    ? embedUrl({ kind, locale, theme, hostHref: window.location.href, referrer: document.referrer })
    : null;

  useEffect(() => {
    if (!src) return;
    function onMessage(event: MessageEvent) {
      // Both checks, always: without the source check any frame on this page
      // could resize or navigate the embed; without the origin check a page
      // that got itself framed inside our iframe could.
      const frame = frameRef.current;
      if (!frame || event.source !== frame.contentWindow || event.origin !== PLATFORM_ORIGIN) return;
      const message = parseEmbedMessage(event.data);
      if (!message) return;
      if (message.type === 'height') {
        setHeight(Math.max(Math.ceil(message.height), MIN_HEIGHT));
      } else if (message.type === 'redirect') {
        // A redirect fired inside the iframe would navigate the iframe; the
        // point of the message is to move the visitor's page.
        window.location.assign(message.url);
      } else {
        // The one conversion number this site reports. It used to fire from
        // the native form's submit handler; the iframe boundary would have
        // silently zeroed it, which is exactly the kind of "everything looks
        // fine" failure the platform's own embed contract warns about.
        track(message.kind === 'form' ? 'lead_submitted' : 'assessment_booked', { locale, source: 'bis-platform' });
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [src, locale]);

  const title = t(kind === 'form' ? 'formTitle' : 'bookTitle');
  const fallback = t(kind === 'form' ? 'formFallback' : 'bookFallback');

  return (
    <div data-testid={`platform-embed-${kind}`}>
      {src ? (
        <iframe
          ref={frameRef}
          src={src}
          title={title}
          loading="lazy"
          className="block w-full rounded-lg border-0"
          style={{ height }}
        />
      ) : (
        <div aria-hidden="true" className="w-full animate-pulse rounded-lg bg-surface-alt" style={{ height }} />
      )}
      <a
        href={publicPageUrl(kind, locale)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm font-bold text-link"
      >
        {fallback} &gt;
      </a>
    </div>
  );
}
