import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="border-t border-hairline bg-surface-alt">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="font-extrabold text-ink">bis&gt;</p>
          <p className="mt-2 text-sm text-ink-muted">{t('tagline')}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-ink-muted">{t('expertise')}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>{t('aiStrategy')}</li><li>{t('infrastructure')}</li><li>{t('webDev')}</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-ink-muted">{t('company')}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>{t('methodology')}</li><li><Link href="/capabilities">{t('capabilities')}</Link></li>
            <li><Link href="/faq">{t('faq')}</Link></li>
            <li><Link href="/service-area">{t('serviceArea')}</Link></li>
            <li><Link href="/resources">{t('resources')}</Link></li>
            <li><Link href="/contact">{t('contactCol')}</Link></li>
            <li><Link href="/privacy">{t('privacy')}</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-ink-muted">{t('location')}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>{t('city')}</li><li>{t('region')}</li>
            <li><a href={`mailto:${t('email')}`} className="text-primary">{t('email')}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-hairline py-4 text-center text-xs text-ink-muted">{t('rights')}</div>
    </footer>
  );
}
