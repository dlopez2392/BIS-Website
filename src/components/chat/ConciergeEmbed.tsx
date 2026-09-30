'use client';
import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { CONCIERGE_PUBLIC_ID, EMBED_SCRIPT_URL } from '@/lib/platform';
import { mountConcierge } from '@/lib/concierge/mount';

/**
 * The website assistant: the BIS Platform's concierge, the same one every
 * client of the platform can put on their own site. Nothing about the
 * conversation runs here — the platform's loader draws a launcher and a panel
 * and the chat lives in its iframe, answering from the BIS account's own
 * receptionist profile and filing leads straight into the CRM.
 *
 * `NEXT_PUBLIC_AI_ENABLED` stays the kill switch it always was: unset, the
 * site renders no assistant at all.
 *
 * Remounted when the language or the theme changes, because both are baked
 * into the iframe's URL at mount. Waits for next-themes to resolve so the
 * first mount is never in the wrong colours.
 */
export function ConciergeEmbed() {
  const locale = useLocale();
  const t = useTranslations('chat');
  const title = t('open');
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AI_ENABLED !== 'true') return;
    if (resolvedTheme !== 'light' && resolvedTheme !== 'dark') return;
    return mountConcierge({
      scriptUrl: EMBED_SCRIPT_URL, publicId: CONCIERGE_PUBLIC_ID, locale, theme: resolvedTheme, title,
    });
  }, [locale, resolvedTheme, title]);

  return null;
}
