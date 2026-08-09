import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

const sendMessage = vi.fn();
let mockMessages: Array<{ id: string; role: string; parts: Array<{ type: string; text: string }> }> = [];

vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({ messages: mockMessages, sendMessage, status: 'ready' }),
}));

let mockPathname = '/capabilities';
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => mockPathname,
}));

import { ChatWidget } from '../ChatWidget';

const messages = {
  chat: {
    open: 'Chat with us',
    title: 'BIS Assistant',
    greeting: 'Hi!',
    placeholder: 'Type…',
    send: 'Send',
    close: 'Close chat',
  },
};

function renderWidget(locale: 'en' | 'es' = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ChatWidget />
    </NextIntlClientProvider>,
  );
}

describe('ChatWidget', () => {
  const orig = process.env.NEXT_PUBLIC_AI_ENABLED;
  afterEach(() => {
    process.env.NEXT_PUBLIC_AI_ENABLED = orig;
    sendMessage.mockReset();
    mockMessages = [];
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
    expect(screen.getByRole('button', { name: /Chat with us/i })).toBeTruthy();
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
      { body: { locale: 'es', path: '/es/capabilities', timeZone: expect.any(String) } },
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
      { body: { locale: 'en', path: '/en', timeZone: expect.any(String) } },
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
});
