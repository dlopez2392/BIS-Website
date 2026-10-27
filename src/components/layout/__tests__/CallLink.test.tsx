import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
const track = vi.fn();
vi.mock('@vercel/analytics', () => ({ track: (...args: unknown[]) => track(...args) }));
vi.mock('next/navigation', () => ({ usePathname: () => '/en/services' }));

import { CallLink } from '../CallLink';
import { business } from '@/lib/seo/business';

const messages = { nav: { call: 'Call us', callAria: 'Call BIS at {phone}' } };

function renderLink(props: Parameters<typeof CallLink>[0] = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CallLink {...props} />
    </NextIntlClientProvider>,
  );
}

describe('CallLink', () => {
  it('links to the dialable form of the configured business number', () => {
    const { container } = renderLink();
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('tel:+19565061545');
  });

  it('prints the number in human form', () => {
    const { container } = renderLink();
    expect(container.textContent).toContain('(956) 506-1545');
  });

  it('labels itself for screen readers with the number interpolated', () => {
    const { container } = renderLink();
    expect(container.querySelector('a')?.getAttribute('aria-label')).toBe('Call BIS at (956) 506-1545');
  });

  it('can hide the digits for icon-only placements but stays labelled', () => {
    const { container } = renderLink({ withNumber: false });
    expect(container.textContent).not.toContain('(956) 506-1545');
    expect(container.querySelector('a')?.getAttribute('aria-label')).toBe('Call BIS at (956) 506-1545');
    expect(container.querySelector('a')?.getAttribute('href')).toBe('tel:+19565061545');
  });

  it('can show the label for the mobile menu row', () => {
    const { container } = renderLink({ withLabel: true });
    expect(container.textContent).toContain('Call us');
    expect(container.textContent).toContain('(956) 506-1545');
  });

  it('renders the number from business.ts, not a hardcoded copy', () => {
    // Guards against the href and the printed digits drifting from the source
    // of truth that JSON-LD also publishes.
    const { container } = renderLink();
    const digits = business.phone.replace(/\D/g, '');
    expect(container.querySelector('a')?.getAttribute('href')).toBe(`tel:+${digits}`);
  });

  it('reports a click as call_click with the page, and still runs its own onClick (mutation: drop the track call -> FAILS)', () => {
    track.mockReset();
    const onClick = vi.fn();
    const { container } = renderLink({ onClick });
    fireEvent.click(container.querySelector('a')!);
    expect(track).toHaveBeenCalledWith('call_click', { path: '/en/services' });
    expect(onClick).toHaveBeenCalledOnce();
  });
});
