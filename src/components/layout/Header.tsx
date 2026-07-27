import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';
import { MobileNav } from './MobileNav';
import { CallLink } from './CallLink';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function Header() {
  const t = useTranslations('nav');
  const items = [
    { href: '/', label: t('home') },
    { href: '/services', label: t('services') },
    { href: '/industries', label: t('industries') },
    { href: '/about', label: t('about') },
    { href: '/insights', label: t('insights') },
    { href: '/contact', label: t('contact') },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-surface/80 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-extrabold tracking-tight text-ink">bis&gt;</Link>
        <nav className="hidden items-center gap-6 md:flex">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="text-sm text-ink-muted hover:text-ink">
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <CallLink className="hidden items-center gap-2 text-sm font-bold text-ink-muted hover:text-ink md:inline-flex" />
          <LocaleSwitcher />
          <ThemeToggle />
          {/* Icon-only tap-to-call, one tap with no menu — mobile visitors are the ones who dial. */}
          <CallLink
            withNumber={false}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-ink hover:bg-surface-alt md:hidden"
          />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
