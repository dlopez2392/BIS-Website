import type React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '../Hero';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...p }: { children?: React.ReactNode } & Record<string, unknown>) => <a {...p}>{children}</a>,
}));

beforeAll(() => {
  // jsdom has no 2D canvas; returning null makes Hero's effect bail early + keeps output pristine.
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

describe('Hero', () => {
  it('renders the full headline, both CTAs, and a decorative (aria-hidden) canvas', () => {
    const { container } = render(
      <Hero kicker="Kick" title="Let us Be your" titleAccent="Intelligent Solution."
        body="Body copy" cta="See how we do it" cta2="Book a free assessment" />,
    );
    expect(screen.getByRole('heading', { name: /Let us Be your Intelligent Solution\./i })).toBeTruthy();
    expect(screen.getByText(/See how we do it/)).toBeTruthy();
    expect(screen.getByText('Book a free assessment')).toBeTruthy();
    expect(container.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });
});
