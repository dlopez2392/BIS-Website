import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../../../messages/en.json';
import es from '../../../../messages/es.json';

let theme: string | undefined = 'dark';
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: theme }) }));
// The voice panel opens a WebRTC session; here it only has to be present.
vi.mock('@/components/sofia/TalkToSofia', () => ({
  TalkToSofia: ({ placement }: { placement?: string }) => <div data-testid="talk" data-placement={placement} />,
}));

import { AskBis } from '../AskBis';

function ui(locale: 'en' | 'es' = 'en') {
  const messages = locale === 'es' ? es : en;
  return (
    <NextIntlClientProvider locale={locale} messages={{ chat: messages.chat }}>
      <AskBis />
    </NextIntlClientProvider>
  );
}

const frame = () => document.querySelector<HTMLIFrameElement>('iframe');
const launcher = () => document.querySelector<HTMLButtonElement>('.ask-launch')!;
const panel = () => screen.queryByRole('dialog', { name: 'Ask BIS' });

describe('AskBis', () => {
  const original = process.env.NEXT_PUBLIC_AI_ENABLED;
  beforeEach(() => {
    theme = 'dark';
    process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
  });
  afterEach(() => {
    process.env.NEXT_PUBLIC_AI_ENABLED = original;
    vi.useRealTimers();
  });

  it('renders nothing when the kill switch is off', () => {
    process.env.NEXT_PUBLIC_AI_ENABLED = 'false';
    const { container } = render(ui());
    expect(container.innerHTML).toBe('');
  });

  it('preloads the chat, hidden, before anyone opens it — so a fast first message is not refused', () => {
    render(ui('es'));
    const src = new URL(frame()!.src);
    expect(`${src.origin}${src.pathname}`).toBe('https://app.bis-rgv.com/c/b2swbbu52be8');
    expect(src.searchParams.get('locale')).toBe('es');
    expect(src.searchParams.get('theme')).toBe('dark');
    expect(screen.queryByRole('dialog')).toBeNull(); // hidden until opened
  });

  it('waits for the theme to resolve rather than loading the chat in the wrong colours', () => {
    theme = undefined;
    render(ui());
    expect(frame()).toBeNull();
  });

  it('opens on the Type tab and closes with its × and with Esc, handing focus back', () => {
    render(ui());
    expect(launcher().getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(launcher());
    expect(panel()).not.toBeNull();
    expect(launcher().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Type', selected: true })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(launcher());

    fireEvent.click(launcher());
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(panel()).toBeNull();
  });

  it('closes on the chat page\'s own close message — but only from that frame and the platform\'s origin', () => {
    render(ui());
    fireEvent.click(launcher());
    const win = frame()!.contentWindow;
    const send = (origin: string, source: MessageEventSource | null) => act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { type: 'bis-concierge-close' }, origin, source }));
    });

    send('https://app.bis-rgv.com', window); // right message, some other window
    expect(panel()).not.toBeNull();
    send('https://evil.example', win); // right window, wrong origin
    expect(panel()).not.toBeNull();
    send('https://app.bis-rgv.com', win);
    expect(panel()).toBeNull();
  });

  it('reloads a frame older than 25 minutes before showing it, ahead of the token\'s expiry', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    render(ui());
    const first = frame();
    vi.setSystemTime(Date.now() + 26 * 60 * 1000);
    fireEvent.click(launcher());
    expect(frame()).not.toBe(first);
  });

  it('does not reload a fresh frame', () => {
    render(ui());
    const first = frame();
    fireEvent.click(launcher());
    expect(frame()).toBe(first);
  });

  it('puts Sofía on the Talk tab, only once it is opened, and ends her when the panel closes', () => {
    render(ui());
    fireEvent.click(launcher());
    expect(screen.queryByTestId('talk')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Talk' }));
    expect(screen.getByTestId('talk').dataset.placement).toBe('ask');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('talk')).toBeNull();
  });

  it('moves between tabs with the arrow keys', () => {
    render(ui());
    fireEvent.click(launcher());
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Type' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Talk', selected: true })).toBe(document.activeElement);
  });
});
