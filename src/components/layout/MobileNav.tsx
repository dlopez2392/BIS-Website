'use client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CallLink } from './CallLink';
import { WhatsAppLink } from './WhatsAppLink';
import { whatsappNumber } from '@/lib/whatsapp';

export function MobileNav() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const items = [
    { href: '/', label: t('home') },
    { href: '/services', label: t('services') },
    { href: '/industries', label: t('industries') },
    { href: '/work', label: t('work') },
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
            <li className="flex items-center gap-5 border-b border-hairline pb-4">
              <CallLink
                withLabel
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-sm font-bold text-ink hover:text-link"
              />
              {/* NEXT_PUBLIC_* is inlined at build time, so a client component
                  can read it directly; the link renders nothing when unset. */}
              <WhatsAppLink
                number={whatsappNumber()}
                withLabel
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-sm font-bold text-ink hover:text-link"
              />
            </li>
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
