import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { routing } from '@/i18n/routing';
import { clientMessages } from '@/i18n/client-namespaces';
import { hankenGrotesk, instrumentSerif } from '@/lib/fonts';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StructuredData } from '@/components/seo/StructuredData';
import { AskBis } from '@/components/chat/AskBis';
import { BotIdClient } from 'botid/client';
import { PROTECTED_ROUTES } from '@/lib/security/protected-routes';
import { SITE_URL } from '@/lib/seo/business';
import { SERVICE_GROUP_IDS } from '@/lib/service-groups';
import { siteVerification } from '@/lib/seo/verification';
import '../globals.css';

/**
 * `resizes-content` makes Chrome on Android shrink the layout viewport for
 * the on-screen keyboard, so fixed-bottom UI and `100dvh` sit above the keys
 * rather than behind them — the contact form's fields and the assistant's
 * full-screen sheet on a phone. The other two values are Next's defaults,
 * restated because exporting `viewport` replaces them.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
  // The browser chrome on a phone matches the site's default ground. The site
  // is dark unless a visitor chooses light (see ThemeProvider), and the OS
  // preference no longer decides the theme, so it no longer decides this.
  themeColor: '#0b0a18',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    metadataBase: new URL(SITE_URL),
    // " · BIS", not the full name: the 32-character suffix pushed 25 English
    // titles past the ~60 characters a results page shows, so they were cut
    // mid-brand. The home page carries the full name instead (see page.tsx).
    title: { default: t('title'), template: '%s · BIS' },
    description: t('description'),
    verification: siteVerification(),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Fed to the business schema so an ES page describes the company in Spanish.
  // SERVICE_GROUP_IDS is the same constant the AI context pack reads, so adding
  // a fourth service group updates both or neither.
  // The full catalogue for this locale; `clientMessages` narrows it to the
  // namespaces the browser actually needs before it crosses the boundary.
  const messages = await getMessages({ locale });

  const tMeta = await getTranslations({ locale, namespace: 'meta' });
  const tServices = await getTranslations({ locale, namespace: 'services' });
  const services = SERVICE_GROUP_IDS.map((id) => ({
    name: tServices(`${id}Title`),
    description: tServices(`${id}Body`),
  }));

  return (
    <html lang={locale} suppressHydrationWarning className={`${hankenGrotesk.variable} ${instrumentSerif.variable}`}>
      <head>
        {/* Arms the two endpoints listed in PROTECTED_ROUTES. No cookie, no
            CAPTCHA, and nothing to consent to — it observes the request that
            posts, not the person reading the page. */}
        <BotIdClient protect={[...PROTECTED_ROUTES]} />
        {/* Prerender the page a visitor is most likely to open next, once
            they show intent by hovering or starting to tap. Chromium only —
            Mozilla and WebKit have both declined the API — so it is a speed
            improvement where it is supported and inert everywhere else.
            "moderate" waits for that intent rather than prefetching the whole
            nav on load, which would download pages nobody asked for on a
            phone connection. */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [{
                where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/api/*' } }] },
                eagerness: 'moderate',
              }],
            }),
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {/* Only the namespaces a client component actually reads. Bare
              <NextIntlClientProvider> inherits the WHOLE catalogue into every
              page's RSC payload — ~77KB of JSON per page view, most of it copy
              for pages the visitor is not on. See client-namespaces.ts. */}
          <NextIntlClientProvider messages={clientMessages(messages)}>
            <Header />
            {children}
            <Footer />
            <AskBis />
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <StructuredData locale={locale} description={tMeta('description')} services={services} />
      </body>
    </html>
  );
}
