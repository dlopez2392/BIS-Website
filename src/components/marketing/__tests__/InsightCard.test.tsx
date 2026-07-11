import type React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsightCard } from '../InsightCard';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...p }: { children?: React.ReactNode } & Record<string, unknown>) => <a {...p}>{children}</a>,
}));

describe('InsightCard', () => {
  it('renders a link to the post with title, category, and meta', () => {
    render(
      <InsightCard href="/insights/hello" category="Insights" title="Hello World"
        date="July 1, 2026" minReadLabel="3 min read" />,
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toContain('/insights/hello');
    expect(screen.getByRole('heading', { name: 'Hello World' })).toBeTruthy();
    expect(screen.getByText('Insights')).toBeTruthy();
    expect(screen.getByText(/3 min read/)).toBeTruthy();
  });
});
