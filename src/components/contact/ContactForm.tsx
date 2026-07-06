'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { contactSchema, type ContactFormValues } from '@/lib/contact-schema';

// `message` is optional-with-default, so the schema's input type (pre-parse)
// differs from ContactFormValues (post-parse output). react-hook-form's field
// values must match the resolver's input type; the transformed/output type
// (ContactFormValues) is what onSubmit receives.
type ContactFormInput = z.input<typeof contactSchema>;

export function ContactForm() {
  const t = useTranslations('contact');
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ContactFormInput, unknown, ContactFormValues>({ resolver: zodResolver(contactSchema), defaultValues: { language: 'en', industry: 'legal', message: '' } });

  // Phase 2 replaces this stub with a Server Action call.
  const onSubmit = async (_values: ContactFormValues) => { setSent(true); };

  if (sent) return <p role="status" className="rounded-md bg-surface-alt p-6 text-ink">{t('success')}</p>;

  const field = 'w-full rounded-md border border-hairline bg-surface px-3 py-2 text-ink';
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div>
        <label htmlFor="fullName" className="text-sm text-ink-muted">{t('fullName')}</label>
        <input id="fullName" className={field} {...register('fullName')} />
        {errors.fullName && <p className="text-sm text-red-600">{t('errRequired')}</p>}
      </div>
      <div>
        <label htmlFor="businessName" className="text-sm text-ink-muted">{t('businessName')}</label>
        <input id="businessName" className={field} {...register('businessName')} />
        {errors.businessName && <p className="text-sm text-red-600">{t('errRequired')}</p>}
      </div>
      <div>
        <label htmlFor="email" className="text-sm text-ink-muted">{t('email')}</label>
        <input id="email" className={field} type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-red-600">{t('errEmail')}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="text-sm text-ink-muted">{t('phone')}</label>
        <input id="phone" className={field} {...register('phone')} />
        {errors.phone && <p className="text-sm text-red-600">{t('errRequired')}</p>}
      </div>
      <div>
        <label htmlFor="industry" className="text-sm text-ink-muted">{t('industry')}</label>
        <select id="industry" className={field} {...register('industry')}>
          <option value="legal">{t('industryLegal')}</option>
          <option value="health">{t('industryHealth')}</option>
          <option value="mfg">{t('industryMfg')}</option>
          <option value="logistics">{t('industryLogistics')}</option>
          <option value="other">{t('industryOther')}</option>
        </select>
      </div>
      <div>
        <label htmlFor="language" className="text-sm text-ink-muted">{t('language')}</label>
        <select id="language" className={field} {...register('language')}>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="text-sm text-ink-muted">{t('message')}</label>
        <textarea id="message" className={field} rows={4} {...register('message')} />
      </div>
      <button type="submit" disabled={isSubmitting} className="rounded-md bg-primary px-6 py-3 font-bold text-on-primary disabled:opacity-60">
        {t('submit')} &gt;
      </button>
    </form>
  );
}
