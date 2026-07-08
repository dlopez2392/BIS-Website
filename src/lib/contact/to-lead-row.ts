import type { ContactFormValues } from '@/lib/contact-schema';
import type { NewLead } from '@/db/schema';

export function toLeadRow(values: ContactFormValues): NewLead {
  return {
    fullName: values.fullName,
    businessName: values.businessName,
    email: values.email,
    phone: values.phone,
    industry: values.industry,
    language: values.language,
    message: values.message ?? '',
  };
}
