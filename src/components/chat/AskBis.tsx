'use client';
import {
  useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { useTheme } from 'next-themes';
import { X } from 'lucide-react';
import { TalkToSofia } from '@/components/sofia/TalkToSofia';
import { CONCIERGE_REFRESH_MS, PLATFORM_ORIGIN, conciergeUrl, isConciergeClose, type Locale } from '@/lib/platform';

type Tab = 'type' | 'talk';

const noSubscribe = () => () => {};

/**
 * "Ask BIS": one launcher for both ways of asking — typing to the website
 * assistant, or talking to Sofía.
 *
 * Replaces the platform loader's bubble ON THIS SITE ONLY. The conversation
 * still lives entirely on the platform: the Type tab is the same `/c/<id>`
 * chat page `embed.js` frames for every client, answering from the BIS
 * account's receptionist profile and filing leads into its CRM. What this
 * component owns is the chrome, so the launcher can be the site's own and the
 * panel can hold Sofía beside the chat.
 *
 * It keeps every promise the loader makes, because those promises are why the
 * chat works:
 *  - the frame PRELOADS, hidden, as soon as the theme is known, so the chat
 *    page's render token is old enough to accept a first message the moment
 *    a fast visitor types one;
 *  - a frame older than 25 minutes is reloaded before the panel opens, ahead
 *    of the token's 30-minute expiry;
 *  - `bis-concierge-close` from the frame closes the panel, accepted only
 *    from that frame's window AND the platform's origin;
 *  - utm_*, click ids, the page and its referrer ride on the frame's url.
 *
 * `NEXT_PUBLIC_AI_ENABLED` stays the kill switch it always was: unset, the
 * site renders no assistant at all.
 */
export function AskBis() {
  if (process.env.NEXT_PUBLIC_AI_ENABLED !== 'true') return null;
  return <AskBisPanel />;
}

function AskBisPanel() {
  const locale = useLocale() as Locale;
  const t = useTranslations('chat');
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'light' || resolvedTheme === 'dark' ? resolvedTheme : null;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('type');
  const [compact, setCompact] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const mountedAt = useRef(0);

  const launcher = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const tabType = useRef<HTMLButtonElement>(null);
  const tabTalk = useRef<HTMLButtonElement>(null);
  const ids = useId();
  const titleId = `${ids}-title`, typeId = `${ids}-type`, talkId = `${ids}-talk`;

  // Built in the browser only — the host url and referrer exist only there,
  // and the server never renders the frame, so hydration has nothing to
  // disagree about. Rebuilt when the language or the theme changes, because
  // both are baked into the chat page at load.
  const inBrowser = useSyncExternalStore(noSubscribe, () => true, () => false);
  const src = useMemo(
    () => (inBrowser && theme
      ? conciergeUrl({ locale, theme, hostHref: window.location.href, referrer: document.referrer })
      : null),
    [inBrowser, locale, theme],
  );
  useEffect(() => { if (src) mountedAt.current = Date.now(); }, [src]);

  const close = useCallback(() => {
    setOpen(false);
    launcher.current?.focus();
  }, []);

  const show = useCallback(() => {
    if (src && Date.now() - mountedAt.current > CONCIERGE_REFRESH_MS) {
      setFrameKey((k) => k + 1);
      mountedAt.current = Date.now();
    }
    setOpen(true);
  }, [src]);

  // Focus follows the visitor: into the chat so they can type, or onto the
  // Talk tab so the start button is one Tab away.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      if (tab === 'type') (frame.current ?? tabType.current)?.focus();
      else tabTalk.current?.focus();
    }, 30);
    return () => window.clearTimeout(id);
    // Only on opening — switching tabs keeps focus on the tab itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!frame.current || event.source !== frame.current.contentWindow) return;
      if (event.origin !== PLATFORM_ORIGIN) return;
      if (isConciergeClose(event.data)) close();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [close]);

  // Over the home page's hero on a phone, the launcher shrinks to its orb so
  // it does not sit on the headline. Re-run on every navigation: this lives
  // in the layout, which persists, so a visitor who arrives on another page
  // and then taps the logo meets a hero that did not exist at mount.
  const pathname = usePathname();
  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([en]) => {
      setCompact(en.isIntersecting && window.innerWidth < 760);
    }, { threshold: 0.35 });
    io.observe(hero);
    return () => { io.disconnect(); setCompact(false); };
  }, [pathname]);

  const select = (next: Tab) => setTab(next);
  const onTabKey = (e: ReactKeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next: Tab = tab === 'type' ? 'talk' : 'type';
    select(next);
    (next === 'type' ? tabType : tabTalk).current?.focus();
  };

  return (
    <div className="ask" data-ask-root>
      <button
        ref={launcher}
        type="button"
        className="ask-launch"
        aria-expanded={open}
        aria-controls={`${ids}-panel`}
        data-compact={String(compact)}
        onClick={show}
      >
        <span className="ask-orb" aria-hidden="true" />
        <span className={compact ? 'ask-word sr-only' : 'ask-word'}>{t('ask')}</span>
      </button>

      <section
        id={`${ids}-panel`}
        className="ask-panel"
        role="dialog"
        aria-labelledby={titleId}
        hidden={!open}
      >
        <header className="ask-head">
          <span className="ask-orb" aria-hidden="true" />
          <div>
            <h2 id={titleId}>{t('ask')}</h2>
            <p>{t('askSub')}</p>
          </div>
          <button type="button" className="ask-x" aria-label={t('close')} onClick={close}>
            <X aria-hidden className="size-4" />
          </button>
        </header>

        <div className="ask-tabs" role="tablist" aria-label={t('tabsLabel')}>
          <button
            ref={tabType} type="button" role="tab" id={`${typeId}-tab`}
            aria-selected={tab === 'type'} aria-controls={typeId} tabIndex={tab === 'type' ? 0 : -1}
            onClick={() => select('type')} onKeyDown={onTabKey}
          >
            {t('tabType')}
          </button>
          <button
            ref={tabTalk} type="button" role="tab" id={`${talkId}-tab`}
            aria-selected={tab === 'talk'} aria-controls={talkId} tabIndex={tab === 'talk' ? 0 : -1}
            onClick={() => select('talk')} onKeyDown={onTabKey}
          >
            {t('tabTalk')}
          </button>
        </div>

        <div id={typeId} className="ask-pane" role="tabpanel" aria-labelledby={`${typeId}-tab`} hidden={tab !== 'type'}>
          {src ? (
            <iframe
              key={frameKey}
              ref={frame}
              id="bis-concierge-frame"
              src={src}
              title={t('frameTitle')}
            />
          ) : null}
        </div>

        <div id={talkId} className="ask-pane ask-talk" role="tabpanel" aria-labelledby={`${talkId}-tab`} hidden={tab !== 'talk'}>
          <p>{t('talkBlurb')}</p>
          {/* Mounted only while this tab is showing in an open panel: closing
              the panel or switching to Type ends a live conversation rather
              than leaving her voice playing with no visible way to stop it. */}
          {open && tab === 'talk' ? <TalkToSofia placement="ask" bare /> : null}
        </div>
      </section>
    </div>
  );
}
