import { businessSchema, type ServiceOffer } from '@/lib/seo/schema';
import { JsonLd } from './JsonLd';

/**
 * The business entity, emitted on every page. `description` and `services`
 * arrive already translated: the schema on an ES page described the company in
 * English until this took props.
 */
export function StructuredData({
  locale,
  description,
  services,
}: {
  locale: string;
  description: string;
  services?: ServiceOffer[];
}) {
  return <JsonLd data={businessSchema({ locale, description, services })} />;
}
