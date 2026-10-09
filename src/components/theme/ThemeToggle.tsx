'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/** `label` is the button's accessible name. It comes from the caller's
 *  translations (Header passes `nav.toggleTheme`) because every /es page read
 *  "Toggle theme" to a screen reader while the rest of the page was Spanish. */
export function ThemeToggle({ label = 'Toggle theme' }: { label?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // next-themes hydration guard: must set mounted after first client render
  // to avoid a server/client mismatch on the resolved theme.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <button
      type="button"
      aria-label={label}
      // From the resolved theme, not `isDark`: the icon waits for mount, the
      // action must not. With dark the default, a click in the instant
      // between hydration and that effect read "not dark" and set dark —
      // a dead first click.
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-ink hover:bg-surface-alt"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
