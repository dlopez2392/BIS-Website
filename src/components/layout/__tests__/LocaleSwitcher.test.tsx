import type React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LocaleSwitcher } from '../LocaleSwitcher';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/services',
  Link: ({ children, ...p }: { children?: React.ReactNode } & Record<string, unknown>) => <a {...p}>{children}</a>,
}));

describe('LocaleSwitcher', () => {
  it('offers both EN and ES links', () => {
    render(
      <NextIntlClientProvider locale="en" messages={{}}>
        <LocaleSwitcher />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('link', { name: 'EN' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'ES' })).toBeTruthy();
  });
});
