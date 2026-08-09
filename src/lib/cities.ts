/**
 * Cities that get their own page under /service-area/<id>.
 *
 * Deliberately NOT every city in `business.areaServed`. A location page earns
 * its place by having something specific to say about the businesses there —
 * five real pages beat thirteen near-duplicates, which search engines discount
 * as doorway pages anyway. The umbrella /service-area page still names all
 * fourteen.
 *
 * Copy lives in the `cities` i18n namespace (cities.<id>.*), city names are
 * language-neutral proper nouns and stay here.
 */
export const cityPages = [
  { id: 'harlingen', name: 'Harlingen' },
  { id: 'mcallen', name: 'McAllen' },
  { id: 'brownsville', name: 'Brownsville' },
  { id: 'edinburg', name: 'Edinburg' },
  { id: 'weslaco', name: 'Weslaco' },
] as const;

export type CityPage = (typeof cityPages)[number];
export type CityId = CityPage['id'];

export const cityIds: readonly CityId[] = cityPages.map((c) => c.id);

export function getCity(id: string): CityPage | undefined {
  return cityPages.find((c) => c.id === id);
}

/** Text keys every city must define in both locales. */
export const cityTextKeys = ['metaTitle', 'metaDescription', 'heading', 'intro', 'howBody'] as const;

/** Each city lists the sectors it actually has, as {title, body} pairs. */
export interface CitySector {
  title: string;
  body: string;
}
