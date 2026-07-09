'use client';
import { useEffect } from 'react';
import Cal, { getCalApi } from '@calcom/embed-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

const CAL_LINK = process.env.NEXT_PUBLIC_CALCOM_LINK ?? 'dan-lopez/assessment';

export function BookingEmbed() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal('ui', { theme, hideEventTypeDetails: false, layout: 'month_view' });
    })();
  }, [theme]);

  return (
    <div>
      <Cal
        calLink={CAL_LINK}
        style={{ width: '100%', height: '600px', overflow: 'scroll' }}
        config={{ layout: 'month_view', theme, language: locale }}
      />
      <a
        href={`https://cal.com/${CAL_LINK}`}
        className="mt-3 inline-block text-sm font-bold text-primary"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('bookFallback')} &gt;
      </a>
    </div>
  );
}
