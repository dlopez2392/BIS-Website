'use client';
import { useLocale } from 'next-intl';
import { usePathname, Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

const LOCALES = ['en', 'es'] as const;

export function LocaleSwitcher() {
  const active = useLocale();
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 text-sm font-bold">
      {LOCALES.map((loc, i) => (
        <span key={loc} className="flex items-center gap-1">
          {i > 0 && <span className="text-hairline">|</span>}
          <Link
            href={pathname}
            locale={loc}
            className={cn(loc === active ? 'text-primary' : 'text-ink-muted hover:text-ink')}
          >
            {loc.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
