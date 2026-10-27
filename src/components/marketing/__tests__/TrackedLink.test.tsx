import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';

const track = vi.fn();
vi.mock('@vercel/analytics', () => ({ track: (...args: unknown[]) => track(...args) }));
vi.mock('next/navigation', () => ({ usePathname: () => '/es/services' }));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

import { TrackedLink } from '../TrackedLink';

beforeEach(() => track.mockReset());

describe('TrackedLink', () => {
  it('reports cta_click with what it is, its service and the page', () => {
    const { container } = render(<TrackedLink href="/contact" cta="service" service="ai">Talk</TrackedLink>);
    fireEvent.click(container.querySelector('a')!);
    expect(track).toHaveBeenCalledWith('cta_click', { cta: 'service', service: 'ai', path: '/es/services' });
  });

  it('leaves `service` out when there is none, rather than sending it empty', () => {
    const { container } = render(<TrackedLink href="/contact" cta="assessment">Book</TrackedLink>);
    fireEvent.click(container.querySelector('a')!);
    expect(track).toHaveBeenCalledWith('cta_click', { cta: 'assessment', path: '/es/services' });
  });

  it('is still an ordinary link to its href', () => {
    const { container } = render(<TrackedLink href="/tools/security-check" cta="first_step">Check</TrackedLink>);
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/tools/security-check');
  });
});
