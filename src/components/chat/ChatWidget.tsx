'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { useTranslations, useLocale } from 'next-intl';
import { MessageCircle, X, Send } from 'lucide-react';
import { usePathname, Link } from '@/i18n/navigation';
import { linkify } from './linkify';
import { loadMessages, saveMessages, MAX_STORED } from './session';

const SUGGESTIONS = ['suggestion1', 'suggestion2', 'suggestion3'] as const;

export function ChatWidget() {
  const t = useTranslations('chat');
  const locale = useLocale();
  // next-intl strips the locale prefix, so rebuild the form the API validates.
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, setMessages, sendMessage, status, error } = useChat();

  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);
  // Set when the panel is closed by a keyboard or a button, so focus can be
  // put back on the launcher once React has actually remounted it.
  const returnFocus = useRef(false);

  // Restore once, on the client only. Before this a reload emptied the box,
  // which is exactly what happens when a visitor follows a link the assistant
  // gave them and comes back.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const saved = loadMessages();
    if (saved.length) setMessages(saved);
  }, [setMessages]);

  useEffect(() => {
    if (restored.current && messages.length) saveMessages(messages);
  }, [messages]);

  // Follow the conversation as it grows, without yanking the page for someone
  // who has asked for less motion.
  useEffect(() => {
    if (!open) return;
    const reduce = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Guarded because scrolling is a nicety and not every environment has it —
    // jsdom does not, and a chat widget must never be why a page throws.
    const end = endRef.current;
    if (typeof end?.scrollIntoView === 'function') {
      end.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' });
    }
  }, [messages, status, open]);

  // Esc closes and puts focus back where it came from, which is the difference
  // between a panel a keyboard user can leave and one that drops them on the
  // body with nothing selected.
  const close = useCallback(() => {
    returnFocus.current = true;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Deliberately a separate effect that runs AFTER the close. Calling focus()
  // inside the key handler focused a launcher that React had not remounted
  // yet, which left focus on <body> — verified in a browser before this fix.
  useEffect(() => {
    if (open || !returnFocus.current) return;
    returnFocus.current = false;
    launcherRef.current?.focus();
  }, [open]);

  const atLimit = messages.length >= MAX_STORED;
  const busy = status === 'submitted' || status === 'streaming';

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || atLimit || busy) return;
    sendMessage({ text: trimmed }, { body: { locale, path: `/${locale}${pathname === '/' ? '' : pathname}` } });
    setInput('');
  }, [atLimit, busy, locale, pathname, sendMessage]);

  if (process.env.NEXT_PUBLIC_AI_ENABLED !== 'true') return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t('title')}
          className="flex h-[30rem] w-[21rem] flex-col rounded-xl border border-hairline bg-surface-alt shadow-xl sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <span className="font-bold text-ink">{t('title')}</span>
            <button
              type="button"
              aria-label={t('close')}
              onClick={close}
              className="rounded text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            <p className="text-ink-muted">{t('greeting')}</p>

            <ul aria-label={t('messagesLabel')} aria-live="polite" className="space-y-3">
              {messages.map((m) => (
                <li key={m.id} className={m.role === 'user' ? 'text-right' : ''}>
                  <span className={m.role === 'user'
                    ? 'inline-block rounded-lg bg-primary px-3 py-2 text-left text-on-primary'
                    : 'inline-block rounded-lg bg-surface px-3 py-2 text-ink'}>
                    {m.parts.filter((p) => p.type === 'text').map((p, i) => (
                      <span key={i}>{linkify((p as { text: string }).text)}</span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>

            {/* A blank box tells a visitor nothing about what this can do. */}
            {messages.length === 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent">{t('suggestionsLabel')}</p>
                <ul className="mt-2 space-y-2">
                  {SUGGESTIONS.map((key) => (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => send(t(key))}
                        className="w-full rounded-lg border border-hairline px-3 py-2 text-left text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                      >
                        {t(key)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {busy && (
              <p data-testid="chat-thinking" className="flex items-center gap-1.5 text-ink-muted">
                <span className="sr-only">{t('thinking')}</span>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-ink-muted motion-safe:animate-pulse"
                    style={{ animationDelay: `${i * 160}ms` }}
                  />
                ))}
              </p>
            )}

            {/* Until now a failure rendered as nothing at all, so a broken
                model call looked like the assistant ignoring the visitor.

                The wording is deliberately ours and never the server's.
                `error.message` carries whatever the response body happened to
                be — for a framework 500 that is raw internals, observed in
                testing as the literal string "boom" shown to the visitor. The
                route still writes a localized sentence for the log and for any
                non-browser caller; what a person reads here is this copy,
                which also gives them a phone number. */}
            {error && (
              <div data-testid="chat-error" role="alert" className="rounded-lg border border-hairline bg-surface p-3">
                <p className="font-semibold text-ink">{t('errorHeading')}</p>
                <p className="mt-1 text-ink-muted">{t('errorFallback')}</p>
              </div>
            )}

            {atLimit && (
              <div className="rounded-lg border border-hairline bg-surface p-3">
                <p className="text-ink">{t('limitReached')}</p>
                <Link href="/contact" className="mt-2 inline-block font-semibold text-link underline">
                  {t('limitCta')}
                </Link>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2 border-t border-hairline p-3"
          >
            <input
              ref={inputRef}
              data-testid="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('placeholder')}
              aria-label={t('placeholder')}
              disabled={atLimit}
              className="flex-1 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            />
            <button
              type="submit"
              aria-label={t('send')}
              disabled={busy || atLimit}
              className="rounded-md bg-primary px-3 text-on-primary disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <button
          ref={launcherRef}
          data-testid="chat-launcher"
          aria-label={t('open')}
          onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
