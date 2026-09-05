/**
 * Industries that get their own page under /industries/<id>.
 *
 * The five here are the ones the /industries index already names, so a card a
 * visitor clicks now leads somewhere instead of nowhere. They are also the
 * five where a search like "IT support for a clinic in McAllen" has real local
 * volume and no page in the Valley currently answers it.
 *
 * Copy lives in the `industries.pages.<id>.*` namespace so both languages are
 * enforced by the same tests every other page's copy is. Ids are stable URL
 * segments and never translated: /es/industries/medical is correct, because
 * translating the path would break every link the day the wording changes.
 */
export const industryPages = [
  { id: 'legal', labelKey: 'legalLabel' },
  { id: 'medical', labelKey: 'medLabel' },
  { id: 'logistics', labelKey: 'logLabel' },
  { id: 'trades', labelKey: 'tradesLabel' },
  { id: 'agriculture', labelKey: 'agLabel' },
] as const;

export type IndustryPage = (typeof industryPages)[number];
export type IndustryId = IndustryPage['id'];

export const industryIds: readonly IndustryId[] = industryPages.map((i) => i.id);

export function getIndustry(id: string): IndustryPage | undefined {
  return industryPages.find((i) => i.id === id);
}

/** Text keys every industry must define in both locales. */
export const industryTextKeys = ['metaTitle', 'metaDescription', 'heading', 'intro', 'sofia'] as const;

/** Each industry lists the work it actually involves, as {title, body} pairs. */
export interface IndustryWorkflow {
  title: string;
  body: string;
}

/** Three questions a business in that trade actually asks, answered. */
export interface IndustryQuestion {
  q: string;
  a: string;
}
