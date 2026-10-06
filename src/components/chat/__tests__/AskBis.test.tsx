import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../../../messages/en.json';
import es from '../../../../messages/es.json';

let theme: string | undefined = 'dark';
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: theme }) }));
const track = vi.fn();
vi.mock('@vercel/analytics', () => ({ track: (...args: unknown[]) => track(...args) }));
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
    // The panel draws its own header and close; the chat must not stack its own.
    expect(src.searchParams.get('chrome')).toBe('bare');
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

  it('puts Sofía on the Talk tab only while it shows: switching to Type or closing ends her', () => {
    render(ui());
    fireEvent.click(launcher());
    expect(screen.queryByTestId('talk')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Talk' }));
    expect(screen.getByTestId('talk').dataset.placement).toBe('ask');
    fireEvent.click(screen.getByRole('tab', { name: 'Type' }));
    expect(screen.queryByTestId('talk')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Talk' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('talk')).toBeNull();
  });

  it('moves between tabs with the arrow keys', () => {
    render(ui());
    fireEvent.click(launcher());
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Type' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Talk', selected: true })).toBe(document.activeElement);
  });

  it('suggests questions only once the chat has loaded, posts a tap to the platform alone, then steps aside', () => {
    render(ui());
    fireEvent.click(launcher());
    // Before the frame loads, a posted question would be lost: no chips yet.
    expect(screen.queryByRole('group', { name: 'Suggested questions' })).toBeNull();
    const el = frame()!;
    fireEvent.load(el);
    const group = screen.getByRole('group', { name: 'Suggested questions' });
    const first = en.chat.chips.top[0];
    const post = vi.spyOn(el.contentWindow!, 'postMessage').mockImplementation(() => {});
    fireEvent.click(within(group).getByRole('button', { name: first }));
    // MUTATION: post with "*" — a frame that navigated elsewhere would get it.
    expect(post).toHaveBeenCalledWith({ type: 'bis-concierge-ask', text: first }, 'https://app.bis-rgv.com');
    expect(screen.queryByRole('group', { name: 'Suggested questions' })).toBeNull();
  });

  it('suggests the questions for the section being read', () => {
    let fire: (target: Element) => void = () => {};
    class IO {
      constructor(cb: (e: Array<{ isIntersecting: boolean; target: Element }>) => void) {
        fire = (target) => cb([{ isIntersecting: true, target }]);
      }
      observe() {} disconnect() {} unobserve() {}
    }
    vi.stubGlobal('IntersectionObserver', IO);
    const sofia = document.createElement('section');
    sofia.setAttribute('data-ask-section', 'sofia');
    document.body.appendChild(sofia);
    try {
      render(ui('es'));
      fireEvent.click(launcher());
      fireEvent.load(frame()!);
      act(() => fire(sofia));
      const group = screen.getByRole('group', { name: 'Preguntas sugeridas' });
      expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(es.chat.chips.sofia);
    } finally {
      sofia.remove();
      vi.unstubAllGlobals();
    }
  });

  it('records an open and a suggestion tap, with the section, as the Phase 2 baseline', () => {
    track.mockReset();
    render(ui());
    fireEvent.click(launcher());
    expect(track).toHaveBeenCalledWith('ask_open', { section: 'top' });
    const el = frame()!;
    fireEvent.load(el);
    vi.spyOn(el.contentWindow!, 'postMessage').mockImplementation(() => {});
    fireEvent.click(within(screen.getByRole('group', { name: 'Suggested questions' })).getAllByRole('button')[0]!);
    expect(track).toHaveBeenCalledWith('ask_suggestion', { section: 'top' });
  });
});
