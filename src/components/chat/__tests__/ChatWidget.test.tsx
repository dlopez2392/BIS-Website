import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({ messages: [], sendMessage: vi.fn(), status: 'ready' }),
}));

import { ChatWidget } from '../ChatWidget';

const messages = { chat: {
  open: 'Chat with us', title: 'BIS Assistant', greeting: 'Hi!',
  placeholder: 'Type…', send: 'Send', close: 'Close chat',
} };
function renderWidget() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}><ChatWidget /></NextIntlClientProvider>
  );
}

describe('ChatWidget', () => {
  const orig = process.env.NEXT_PUBLIC_AI_ENABLED;
  afterEach(() => { process.env.NEXT_PUBLIC_AI_ENABLED = orig; });

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
});
