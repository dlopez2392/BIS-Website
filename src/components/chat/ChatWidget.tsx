'use client';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { useTranslations } from 'next-intl';
import { MessageCircle, X, Send } from 'lucide-react';

export function ChatWidget() {
  const t = useTranslations('chat');
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  if (process.env.NEXT_PUBLIC_AI_ENABLED !== 'true') return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || messages.length >= 18) return;
    sendMessage({ text });
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
                  {m.parts.filter((p) => p.type === 'text').map((p, i) => <span key={i}>{(p as { text: string }).text}</span>)}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={submit} className="flex gap-2 border-t border-hairline p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('placeholder')}
              className="flex-1 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink" />
            <button type="submit" aria-label={t('send')} disabled={status !== 'ready'}
              className="rounded-md bg-primary px-3 text-on-primary disabled:opacity-50"><Send size={16} /></button>
          </form>
        </div>
      ) : (
        <button aria-label={t('open')} onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg">
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
