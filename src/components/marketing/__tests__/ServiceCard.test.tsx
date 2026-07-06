import type React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Brain } from 'lucide-react';
import { ServiceCard } from '../ServiceCard';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...p }: { children?: React.ReactNode } & Record<string, unknown>) => <a {...p}>{children}</a>,
}));

describe('ServiceCard', () => {
  it('renders title, body and a learn-more link', () => {
    render(<ServiceCard icon={Brain} title="AI Strategy" body="We automate." href="/services" learnMore="Learn more" />);
    expect(screen.getByRole('heading', { name: 'AI Strategy' })).toBeTruthy();
    expect(screen.getByText('We automate.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /learn more/i })).toBeTruthy();
  });
});
