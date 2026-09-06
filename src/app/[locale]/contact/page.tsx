import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PlatformEmbed } from '@/components/platform/PlatformEmbed';
import { CallLink } from '@/components/layout/CallLink';
import { WhatsAppLink } from '@/components/layout/WhatsAppLink';
import { whatsappNumber } from '@/lib/whatsapp';
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
  const tWhatsApp = await getTranslations({ locale, namespace: 'whatsapp' });
  const bullets = [t('b1'), t('b2'), t('b3'), t('b4')];
  const whatsapp = whatsappNumber();
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
          <p className="mt-4 text-ink-muted">{t('intro')}</p>
          <ul className="mt-6 space-y-2">
            {bullets.map((b) => <li key={b} className="flex items-center gap-2 text-ink"><span className="h-2 w-2 rounded-full bg-accent" />{b}</li>)}
          </ul>
          <div className="mt-8 text-sm text-ink-muted">
            <p className="font-bold uppercase">{t('callHeading')}</p>
            <p>{t('callBody')}</p>
            <CallLink className="mt-3 inline-flex items-center gap-2 text-xl font-extrabold text-ink hover:text-link" />
          </div>
          {whatsapp && (
            <div className="mt-8 text-sm text-ink-muted">
              <p className="font-bold uppercase">{tWhatsApp('contactHeading')}</p>
              <p>{tWhatsApp('contactBody')}</p>
              {/* WhatsApp's own green, deliberately off the site palette: the
                  colour is most of what makes the button recognisable. */}
              <WhatsAppLink
                number={whatsapp}
                withLabel
                iconSize={18}
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 font-semibold text-[#0b0a18] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              />
            </div>
          )}
          <div className="mt-8 text-sm text-ink-muted">
            <p className="font-bold uppercase">{t('localOps')}</p>
            <p>{t('localOpsValue')}</p>
          </div>
        </div>
        <div>
          <PlatformEmbed kind="form" />
          <p className="mt-4 text-xs text-ink-muted">{t('poweredBy')}</p>
        </div>
      </div>
      <section className="mt-20 border-t border-hairline pt-16">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink">{t('bookHeading')}</h2>
        <p className="mt-3 max-w-2xl text-ink-muted">{t('bookSubtext')}</p>
        <div className="mt-8">
          <PlatformEmbed kind="booking" />
        </div>
      </section>
    </main>
  );
}
