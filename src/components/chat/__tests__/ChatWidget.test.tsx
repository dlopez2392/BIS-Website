import type React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../../../messages/en.json';
import es from '../../../../messages/es.json';

const sendMessage = vi.fn();
const setMessages = vi.fn();
let mockMessages: Array<{ id: string; role: string; parts: Array<{ type: string; text: string }> }> = [];
let mockStatus = 'ready';
let mockError: Error | undefined;

vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({ messages: mockMessages, setMessages, sendMessage, status: mockStatus, error: mockError }),
}));

let mockPathname = '/capabilities';
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => mockPathname,
  Link: ({ children, ...p }: { children?: React.ReactNode } & Record<string, unknown>) => <a {...p}>{children}</a>,
}));

import { ChatWidget } from '../ChatWidget';

// The real catalogue, not a stub: a stub silently passes when a new key is
// added to the component and forgotten in translation.
const catalogue = { en, es } as const;

function renderWidget(locale: 'en' | 'es' = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={catalogue[locale]}>
      <ChatWidget />
    </NextIntlClientProvider>,
  );
}

function openWidget(locale: 'en' | 'es' = 'en') {
  process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
  const result = renderWidget(locale);
  fireEvent.click(screen.getByTestId('chat-launcher'));
  return result;
}

describe('ChatWidget', () => {
  const orig = process.env.NEXT_PUBLIC_AI_ENABLED;
  beforeEach(() => window.sessionStorage.clear());
  afterEach(() => {
    process.env.NEXT_PUBLIC_AI_ENABLED = orig;
    sendMessage.mockReset();
    setMessages.mockReset();
    mockMessages = [];
    mockStatus = 'ready';
    mockError = undefined;
    mockPathname = '/capabilities';
  });

  it('renders nothing when the assistant is disabled', () => {
    process.env.NEXT_PUBLIC_AI_ENABLED = 'false';
    const { container } = renderWidget();
    expect(container.innerHTML).toBe('');
  });

  it('renders the launcher button when enabled', () => {
    process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
    renderWidget();
    expect(screen.getByRole('button', { name: en.chat.open })).toBeTruthy();
  });

  it('sends the locale and the locale-prefixed path with the message', () => {
    process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
    mockPathname = '/capabilities';
    renderWidget('es');
    fireEvent.click(screen.getByTestId('chat-launcher'));
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: 'hola' } });
    fireEvent.submit(screen.getByTestId('chat-input').closest('form') as HTMLFormElement);
    expect(sendMessage).toHaveBeenCalledWith(
      { text: 'hola' },
      { body: { locale: 'es', path: '/es/capabilities' } },
    );
  });

  it('sends the bare locale root without a trailing slash', () => {
    process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
    mockPathname = '/';
    renderWidget('en');
    fireEvent.click(screen.getByTestId('chat-launcher'));
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: 'hi' } });
    fireEvent.submit(screen.getByTestId('chat-input').closest('form') as HTMLFormElement);
    expect(sendMessage).toHaveBeenCalledWith(
      { text: 'hi' },
      { body: { locale: 'en', path: '/en' } },
    );
  });

  it('renders URLs in assistant replies as anchors', () => {
    process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
    mockMessages = [
      {
        id: '1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'See https://bis-rgv.com/en/faq for more.' }],
      },
    ];
    const { container } = renderWidget();
    fireEvent.click(screen.getByTestId('chat-launcher'));
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://bis-rgv.com/en/faq');
  });

  it('tells the visitor a failure happened, in their language', () => {
    mockError = new Error('anything at all');
    openWidget('es');
    const alert = screen.getByTestId('chat-error');
    expect(alert.textContent).toContain(es.chat.errorHeading);
    expect(alert.textContent).toContain(es.chat.errorFallback);
  });

  it('never shows the visitor whatever the response body happened to contain', () => {
    // Observed in a browser: a framework 500 put the literal body of the
    // response on screen. error.message is not copy, and is never rendered.
    mockError = new Error('boom: TypeError at /var/task/.next/server/app/api/chat');
    openWidget('en');
    const alert = screen.getByTestId('chat-error');
    expect(alert.textContent).not.toContain('boom');
    expect(alert.textContent).not.toContain('/var/task');
    expect(alert.textContent).toContain(en.chat.errorFallback);
  });

  it('says it is working while a reply is on its way', () => {
    mockStatus = 'streaming';
    openWidget();
    expect(screen.getByTestId('chat-thinking')).toBeTruthy();
    expect(screen.getByText(en.chat.thinking)).toBeTruthy();
  });

  it('offers openers on an empty conversation, and sends one when clicked', () => {
    openWidget();
    fireEvent.click(screen.getByRole('button', { name: en.chat.suggestion1 }));
    expect(sendMessage).toHaveBeenCalledWith(
      { text: en.chat.suggestion1 },
      { body: { locale: 'en', path: '/en/capabilities' } },
    );
  });

  it('drops the openers once the conversation has started', () => {
    mockMessages = [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }];
    openWidget();
    expect(screen.queryByRole('button', { name: en.chat.suggestion1 })).toBeNull();
  });

  it('will not send while a reply is still arriving', () => {
    mockStatus = 'streaming';
    openWidget();
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: 'again' } });
    fireEvent.submit(screen.getByTestId('chat-input').closest('form') as HTMLFormElement);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('stops at the cap and points to a person instead of failing silently', () => {
    mockMessages = Array.from({ length: 18 }, (_, i) => ({
      id: String(i), role: i % 2 ? 'assistant' : 'user', parts: [{ type: 'text', text: 'x' }],
    }));
    openWidget();
    expect(screen.getByText(en.chat.limitReached)).toBeTruthy();
    expect(screen.getByRole('link', { name: en.chat.limitCta })).toBeTruthy();
    expect((screen.getByTestId('chat-input') as HTMLInputElement).disabled).toBe(true);
  });

  it('restores a conversation left behind by a reload', () => {
    window.sessionStorage.setItem('bis:chat', JSON.stringify([
      { id: '1', role: 'user', parts: [{ type: 'text', text: 'earlier question' }] },
    ]));
    openWidget();
    expect(setMessages).toHaveBeenCalledWith([
      expect.objectContaining({ id: '1', role: 'user' }),
    ]);
  });

  it('is a labelled dialog a keyboard user can leave', () => {
    openWidget();
    expect(screen.getByRole('dialog', { name: en.chat.title })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByTestId('chat-launcher')).toBeTruthy();
  });
});
