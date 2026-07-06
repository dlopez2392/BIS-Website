import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('meta');
  return (
    <main className="mx-auto max-w-3xl px-6 py-32 text-center">
      <h1 className="text-4xl font-extrabold text-ink">404</h1>
      <p className="mt-2 text-ink-muted">{t('notFound')}</p>
      <Link href="/" className="mt-6 inline-block rounded-md bg-primary px-5 py-2 font-bold text-on-primary">{t('notFoundCta')}</Link>
    </main>
  );
}
