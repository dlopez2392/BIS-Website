import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

let theme: string | undefined = 'dark';
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: theme }) }));

import { ConciergeEmbed } from '../ConciergeEmbed';

function ui(locale: 'en' | 'es') {
  const open = locale === 'es' ? 'Chatea con nosotros' : 'Chat with us';
  return (
    <NextIntlClientProvider locale={locale} messages={{ chat: { open } }}>
      <ConciergeEmbed />
    </NextIntlClientProvider>
  );
}

const loader = () => document.querySelector<HTMLScriptElement>('script[data-concierge]');

describe('ConciergeEmbed', () => {
  const original = process.env.NEXT_PUBLIC_AI_ENABLED;
  beforeEach(() => {
    document.body.innerHTML = '';
    theme = 'dark';
    process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
  });
  afterEach(() => { process.env.NEXT_PUBLIC_AI_ENABLED = original; });

  it('mounts nothing when the kill switch is off', () => {
    process.env.NEXT_PUBLIC_AI_ENABLED = 'false';
    render(ui('en'));
    expect(loader()).toBeNull();
  });

  it('waits for the theme to resolve rather than mounting in the wrong colours', () => {
    theme = undefined;
    render(ui('en'));
    expect(loader()).toBeNull();
  });

  it('mounts the platform loader for the BIS concierge in the page language and theme', () => {
    render(ui('es'));
    const s = loader()!;
    expect(s.src).toBe('https://app.bis-rgv.com/embed.js');
    expect(s.dataset.concierge).toBe('b2swbbu52be8');
    expect(s.dataset.locale).toBe('es');
    expect(s.dataset.theme).toBe('dark');
    expect(s.dataset.title).toBe('Chatea con nosotros');
  });

  it('remounts, once, when the language changes', () => {
    const { rerender } = render(ui('en'));
    rerender(ui('es'));
    const all = document.querySelectorAll('script[data-concierge]');
    expect(all).toHaveLength(1);
    expect((all[0] as HTMLScriptElement).dataset.locale).toBe('es');
  });

  it('takes itself off the page on unmount', () => {
    const { unmount } = render(ui('en'));
    unmount();
    expect(loader()).toBeNull();
  });
});
