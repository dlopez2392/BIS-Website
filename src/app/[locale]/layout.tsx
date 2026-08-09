import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { routing } from '@/i18n/routing';
import { hankenGrotesk } from '@/lib/fonts';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StructuredData } from '@/components/seo/StructuredData';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { SITE_URL } from '@/lib/seo/business';
import { SERVICE_GROUP_IDS } from '@/lib/ai/site-context';
import { siteVerification } from '@/lib/seo/verification';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('title'), template: '%s · Bespoke Intelligent Solutions' },
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
  const tMeta = await getTranslations({ locale, namespace: 'meta' });
  const tServices = await getTranslations({ locale, namespace: 'services' });
  const services = SERVICE_GROUP_IDS.map((id) => ({
    name: tServices(`${id}Title`),
    description: tServices(`${id}Body`),
  }));

  return (
    <html lang={locale} suppressHydrationWarning className={hankenGrotesk.variable}>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider>
            <Header />
            {children}
            <Footer />
            <ChatWidget />
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <StructuredData locale={locale} description={tMeta('description')} services={services} />
      </body>
    </html>
  );
}
