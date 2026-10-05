'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Dark is the brand's default: the home page is a lit dark ground, and every
 * other page follows so moving between them never flashes. A visitor's own
 * choice from the toggle wins and is remembered. The OS preference is not
 * consulted (`enableSystem={false}`): one look for a first visit, not two.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
