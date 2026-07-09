import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ContactForm } from '@/components/contact/ContactForm';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/contact', title: t('contactTitle'), description: t('contactDescription') });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const bullets = [t('b1'), t('b2'), t('b3'), t('b4')];
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
          <p className="mt-4 text-ink-muted">{t('intro')}</p>
          <ul className="mt-6 space-y-2">
            {bullets.map((b) => <li key={b} className="flex items-center gap-2 text-ink"><span className="h-2 w-2 rounded-full bg-gold" />{b}</li>)}
          </ul>
          <div className="mt-8 text-sm text-ink-muted">
            <p className="font-bold uppercase">{t('localOps')}</p>
            <p>{t('localOpsValue')}</p>
          </div>
        </div>
        <ContactForm />
      </div>
    </main>
  );
}
