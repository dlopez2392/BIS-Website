import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { SERVICE_ANCHORS } from '@/lib/service-groups';
import { Wordmark } from './Wordmark';
import { CallLink } from './CallLink';

type Item = { href: string; key: string };

/**
 * Four groups a visitor can scan, every entry a link. The old footer had a
 * "Company" column of fourteen links beside an "Expertise" column of three
 * that were plain text — styled like links, going nowhere — and a
 * "Methodology" entry with no page behind it.
 */
const GROUPS: { heading: string; items: Item[] }[] = [
  {
    heading: 'services',
    items: [
      { href: '/platform', key: 'platform' },
      { href: `/services#${SERVICE_ANCHORS.g1}`, key: 'aiStrategy' },
      { href: `/services#${SERVICE_ANCHORS.g2}`, key: 'infrastructure' },
      { href: `/services#${SERVICE_ANCHORS.g3}`, key: 'webDev' },
      { href: '/industries', key: 'industries' },
      { href: '/service-area', key: 'serviceArea' },
    ],
  },
  {
    heading: 'company',
    items: [
      { href: '/about', key: 'about' },
      { href: '/how-we-work', key: 'howWeWork' },
      { href: '/work', key: 'work' },
      { href: '/capabilities', key: 'capabilities' },
      { href: '/faq', key: 'faq' },
      { href: '/contact', key: 'contactCol' },
    ],
  },
  {
    heading: 'freeTools',
    items: [
      { href: '/tools/security-check', key: 'securityTool' },
      { href: '/tools/first-hour-back', key: 'hoursTool' },
      { href: '/resources', key: 'resources' },
      { href: '/insights', key: 'insights' },
    ],
  },
  {
    heading: 'legal',
    items: [
      { href: '/trust', key: 'trust' },
      { href: '/privacy', key: 'privacy' },
      { href: '/terms', key: 'terms' },
      { href: '/accessibility', key: 'accessibility' },
    ],
  },
];

// A full-height tap target on a phone (the links are 32px tall there, 24px
// is the WCAG 2.2 floor) without spreading the desktop columns apart.
const LINK = 'inline-block py-1.5 text-ink-muted transition-colors hover:text-ink md:py-1';

export function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="vt-footer border-t border-hairline bg-surface-alt">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[17rem_1fr]">
        <div className="text-sm text-ink-muted">
          <Wordmark className="block font-extrabold text-ink" />
          <p className="mt-2">{t('tagline')}</p>
          <p className="mt-5">{t('city')} · {t('region')}</p>
          <CallLink withIcon={false} className="mt-1 inline-block py-1.5 font-bold text-ink md:py-1" />
          <a href={`mailto:${t('email')}`} className="block py-1.5 text-link [overflow-wrap:anywhere] md:py-1">{t('email')}</a>
        </div>
        <nav aria-label={t('navLabel')} className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {GROUPS.map((group) => (
            <div key={group.heading}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{t(group.heading)}</h2>
              <ul className="mt-3 text-sm">
                {group.items.map((item) => (
                  <li key={item.key}>
                    <Link href={item.href} className={LINK}>{t(item.key)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-hairline py-4 text-center text-xs text-ink-muted">{t('rights')}</div>
    </footer>
  );
}
