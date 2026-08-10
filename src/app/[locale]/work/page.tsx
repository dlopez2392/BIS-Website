import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CallLink } from '@/components/layout/CallLink';
import { pageMetadata } from '@/lib/seo/metadata';
import { workCases } from '@/lib/work';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'work' });
  return pageMetadata({ locale, path: '/work', title: t('title'), description: t('metaDescription') });
}

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'work' });
  const c = await getTranslations('common');

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>

      {workCases.map((entry) => {
        const k = (key: string) => t(`cases.${entry.id}.${key}`);
        const facts = t.raw(`cases.${entry.id}.facts`) as string[];
        const stack = t.raw(`cases.${entry.id}.stack`) as string[];

        return (
          <article key={entry.id} className="mt-12 overflow-hidden rounded-2xl border border-hairline bg-surface-alt">
            <header className="border-b border-hairline p-8 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">{k('label')}</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{k('title')}</h2>
              <p className="mt-4 text-ink-muted">{k('summary')}</p>
            </header>

            <div className="grid gap-10 p-8 sm:p-10 md:grid-cols-2">
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{k('factsHeading')}</h3>
                <ul className="mt-4 space-y-4">
                  {facts.map((fact) => (
                    <li key={fact} className="flex gap-3 text-ink-muted">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{k('builtHeading')}</h3>
                <p className="mt-4 text-ink-muted">{k('builtBody')}</p>
                <h3 className="mt-8 text-xs font-bold uppercase tracking-widest text-ink-muted">{k('stackHeading')}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {stack.map((item) => (
                    <li key={item} className="rounded-full border border-hairline bg-surface px-3 py-1 text-sm text-ink-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {entry.cta === 'call' && (
              <div className="border-t border-hairline bg-primary/5 p-8 sm:p-10">
                <h3 className="text-xl font-bold text-ink">{k('tryHeading')}</h3>
                <p className="mt-2 text-ink-muted">{k('tryBody')}</p>
                <CallLink className="mt-6 inline-flex items-center gap-3 rounded-lg bg-primary px-6 py-3 text-xl font-extrabold text-on-primary" />
                <p className="mt-4 text-sm text-ink-muted">
                  {k('tryNote')}{' '}
                  <Link href="/privacy" className="text-link underline">
                    {k('tryNoteLink')}
                  </Link>
                </p>
              </div>
            )}
          </article>
        );
      })}

      <section className="mt-12 rounded-xl border border-hairline bg-surface-alt p-8">
        <h2 className="text-2xl font-bold text-ink">{t('nextHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t('nextBody')}</p>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold text-ink">{t('ctaTitle')}</h2>
        <p className="mt-2 text-ink-muted">{t('ctaBody')}</p>
        <Link href="/contact" className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-on-primary">
          {c('cta')}
        </Link>
      </section>
    </main>
  );
}
