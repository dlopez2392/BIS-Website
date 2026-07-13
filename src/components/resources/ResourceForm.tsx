'use client';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { track } from '@vercel/analytics';
import { subscriberSchema, type SubscriberInput, type SubscriberValues } from '@/lib/subscriber-schema';
import { subscribeForResource } from '@/app/[locale]/resources/actions';

export function ResourceForm({ slug, downloadUrl }: { slug: string; downloadUrl: string }) {
  const t = useTranslations('resources.form');
  const locale = useLocale() as 'en' | 'es';
  const [sent, setSent] = useState(false);
  const [errored, setErrored] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<SubscriberInput, unknown, SubscriberValues>({
      resolver: zodResolver(subscriberSchema),
      defaultValues: { name: '', resource: slug, locale, newsletterConsent: false },
    });

  const startDownload = () => {
    const a = document.createElement('a');
    a.href = downloadUrl; a.download = '';
    document.body.appendChild(a); a.click(); a.remove();
  };

  const onSubmit = async (values: SubscriberValues) => {
    setErrored(false);
    const result = await subscribeForResource({ ...values, website: honeypotRef.current?.value ?? '' });
    if (result.ok) {
      track('resource_download', { resource: slug });
      startDownload();
      setSent(true);
    } else {
      setErrored(true);
    }
  };

  if (sent) return (
    <div role="status" className="rounded-md bg-surface-alt p-6 text-ink">
      <p>{t('success')}</p>
      <a href={downloadUrl} className="mt-2 inline-block text-primary underline">{t('downloadFallback')}</a>
    </div>
  );

  const field = 'w-full rounded-md border border-hairline bg-surface px-3 py-2 text-ink';
  return (
    // onSubmit only reads honeypotRef.current when the user actually submits,
    // never during render — the compiler can't prove this statically.
    // eslint-disable-next-line react-hooks/refs
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input type="text" tabIndex={-1} autoComplete="off" ref={honeypotRef} className="absolute left-[-9999px] h-0 w-0 opacity-0" aria-hidden="true" />
      <input type="hidden" {...register('resource')} />
      <input type="hidden" {...register('locale')} />
      <div>
        <label htmlFor="resource-name" className="text-sm font-medium text-ink">{t('nameLabel')}</label>
        <input id="resource-name" className={field} {...register('name')} />
      </div>
      <div>
        <label htmlFor="resource-email" className="text-sm font-medium text-ink">{t('emailLabel')}</label>
        <input id="resource-email" type="email" className={field} {...register('email')} />
        {errors.email && <p className="mt-1 text-sm text-red-500">{t('errEmail')}</p>}
      </div>
      <label className="flex items-start gap-2 text-sm text-ink-muted">
        <input type="checkbox" className="mt-1" {...register('newsletterConsent')} />
        <span>{t('consentLabel')}</span>
      </label>
      {errored && <p role="alert" className="text-sm text-red-500">{t('error')}</p>}
      <button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary px-6 py-3 font-bold text-on-primary disabled:opacity-60">
        {isSubmitting ? t('sending') : t('submit')}
      </button>
    </form>
  );
}
