'use client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function MobileNav() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const items = [
    { href: '/', label: t('home') },
    { href: '/services', label: t('services') },
    { href: '/industries', label: t('industries') },
    { href: '/about', label: t('about') },
    { href: '/insights', label: t('insights') },
    { href: '/contact', label: t('contact') },
  ] as const;

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? t('closeMenu') : t('openMenu')}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-ink hover:bg-surface-alt"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-full border-b border-hairline bg-surface px-6 py-4">
          <ul className="flex flex-col gap-4">
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-ink-muted hover:text-ink"
                >
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
