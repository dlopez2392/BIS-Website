'use client';
import { useLocale } from 'next-intl';
import { usePathname, Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

const LOCALES = ['en', 'es'] as const;

export function LocaleSwitcher() {
  const active = useLocale();
  const pathname = usePathname();
  return (
    // Each code is a 32px-tall target (it was 18x20 on a phone, under the
    // WCAG 2.2 24px floor), with the divider between them left untappable.
    <div className="flex items-center text-sm font-bold">
      {LOCALES.map((loc, i) => (
        <span key={loc} className="flex items-center">
          {i > 0 && <span aria-hidden="true" className="text-hairline">|</span>}
          <Link
            href={pathname}
            locale={loc}
            className={cn('inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5', loc === active ? 'text-link' : 'text-ink-muted hover:text-ink')}
          >
            {loc.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
