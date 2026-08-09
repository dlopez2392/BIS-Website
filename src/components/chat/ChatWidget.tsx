'use client';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { useTranslations, useLocale } from 'next-intl';
import { MessageCircle, X, Send } from 'lucide-react';
import { usePathname } from '@/i18n/navigation';
import { linkify } from './linkify';

export function ChatWidget() {
  const t = useTranslations('chat');
  const locale = useLocale();
  // next-intl strips the locale prefix, so rebuild the form the API validates.
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  if (process.env.NEXT_PUBLIC_AI_ENABLED !== 'true') return null;

  const path = `/${locale}${pathname === '/' ? '' : pathname}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || messages.length >= 18) return;
    // The visitor's own zone, so offered appointment times mean what they read.
    // Read at send time rather than render, so it is always current.
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    sendMessage({ text }, { body: { locale, path, timeZone } });
    setInput('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="flex h-[28rem] w-80 flex-col rounded-xl border border-hairline bg-surface-alt shadow-xl">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <span className="font-bold text-ink">{t('title')}</span>
            <button aria-label={t('close')} onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink"><X size={18} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            <p className="text-ink-muted">{t('greeting')}</p>
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'text-right' : ''}>
                <span className={m.role === 'user' ? 'inline-block rounded-lg bg-primary px-3 py-2 text-on-primary' : 'inline-block rounded-lg bg-surface px-3 py-2 text-ink'}>
                  {m.parts.filter((p) => p.type === 'text').map((p, i) => (
                    <span key={i}>{linkify((p as { text: string }).text)}</span>
                  ))}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={submit} className="flex gap-2 border-t border-hairline p-3">
            <input data-testid="chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('placeholder')}
              className="flex-1 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink" />
            <button type="submit" aria-label={t('send')} disabled={status !== 'ready'}
              className="rounded-md bg-primary px-3 text-on-primary disabled:opacity-50"><Send size={16} /></button>
          </form>
        </div>
      ) : (
        <button data-testid="chat-launcher" aria-label={t('open')} onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg">
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
