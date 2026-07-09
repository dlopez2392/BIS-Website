import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@calcom/embed-react', () => ({
  __esModule: true,
  default: () => <div data-testid="cal-embed" />,
  getCalApi: async () => () => {},
}));
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }));

import { BookingEmbed } from '../BookingEmbed';

const messages = { contact: {
  bookHeading: 'Prefer to talk? Book a call.',
  bookSubtext: 'Grab a free 20-minute assessment slot.',
  bookFallback: 'Open the booking page',
} };

describe('BookingEmbed', () => {
  it('renders the embed and a fallback link to the Cal.com page', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <BookingEmbed />
      </NextIntlClientProvider>
    );
    expect(screen.getByTestId('cal-embed')).toBeTruthy();
    const link = screen.getByRole('link', { name: /Open the booking page/i });
    expect(link.getAttribute('href')).toBe('https://cal.com/dan-lopez/assessment');
  });
});
