import { useTranslations } from 'next-intl';
import { Phone } from 'lucide-react';
import { business } from '@/lib/seo/business';
import { telHref, formatUsPhone } from '@/lib/phone';

interface CallLinkProps {
  className?: string;
  /** Show the "Call us" label before the number (used in the mobile menu). */
  withLabel?: boolean;
  /** Hide the digits for icon-only placements (the mobile header button). */
  withNumber?: boolean;
  withIcon?: boolean;
  onClick?: () => void;
}

/**
 * The single place the business number becomes a link. Every placement shares
 * this so the dialable href, the printed form, and the screen-reader label
 * cannot disagree with each other or with `business.phone`.
 */
export function CallLink({
  className,
  withLabel = false,
  withNumber = true,
  withIcon = true,
  onClick,
}: CallLinkProps) {
  const t = useTranslations('nav');
  const display = formatUsPhone(business.phone);

  return (
    <a href={telHref(business.phone)} aria-label={t('callAria', { phone: display })} onClick={onClick} className={className}>
      {withIcon && <Phone size={16} aria-hidden="true" />}
      {withLabel && <span>{t('call')}</span>}
      {withNumber && <span>{display}</span>}
    </a>
  );
}
