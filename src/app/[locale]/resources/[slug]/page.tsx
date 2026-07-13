import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { resources, getResource } from '@/lib/resources';
import { ResourceForm } from '@/components/resources/ResourceForm';

export function generateStaticParams() {
  return resources.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'resources' });
  if (!getResource(slug)) return {};
  return pageMetadata({
    locale, path: `/resources/${slug}`,
    title: t(`items.${slug}.title`),
    description: `${t(`items.${slug}.blurb`)} ${t('detailMetaSuffix')}`,
  });
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const resource = getResource(slug);
  if (!resource) notFound();
  const t = await getTranslations({ locale, namespace: 'resources' });
  const downloadUrl = resource.files[locale as 'en' | 'es'];

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t(`items.${slug}.title`)}</h1>
          <p className="mt-4 text-lg text-ink-muted">{t(`items.${slug}.blurb`)}</p>
          <h2 className="mt-8 text-xs font-bold uppercase tracking-widest text-accent">{t(`items.${slug}.whatsInsideHeading`)}</h2>
          <ul className="mt-3 space-y-2 text-ink">
            <li className="flex gap-2"><span className="text-accent">✓</span>{t(`items.${slug}.point1`)}</li>
            <li className="flex gap-2"><span className="text-accent">✓</span>{t(`items.${slug}.point2`)}</li>
            <li className="flex gap-2"><span className="text-accent">✓</span>{t(`items.${slug}.point3`)}</li>
          </ul>
        </div>
        <div className="rounded-xl border border-hairline bg-surface-alt p-8">
          <ResourceForm slug={slug} downloadUrl={downloadUrl} />
        </div>
      </div>
    </main>
  );
}
