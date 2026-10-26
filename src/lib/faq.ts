// Category → ordered question ids. Text lives in the `faq` i18n namespace
// (faq.items.<id>.q / .a); headings in faq.categories.<id>.
export const faqCategories = [
  { id: 'general', items: ['whatIsBis', 'whoServe', 'bespoke'] },
  { id: 'ai', items: ['aiPractical', 'aiCost'] },
  { id: 'security', items: ['dataHandling', 'compliance', 'replaceMsp'] },
  { id: 'web', items: ['ownWebsite', 'webWhat'] },
  { id: 'working', items: ['howStart', 'pricing', 'remote'] },
] as const;

export const faqItemIds: string[] = faqCategories.flatMap((c) => [...c.items]);

/**
 * The questions /services answers in place, in the order an owner asks them:
 * how it starts, what it costs, whether they must switch IT providers, who
 * owns the website, what AI costs to run, and whether we come to them. The
 * same items as /faq (one source of copy), a subset of it.
 */
export const SERVICES_FAQ = ['howStart', 'pricing', 'replaceMsp', 'ownWebsite', 'aiCost', 'remote'] as const satisfies readonly (typeof faqItemIds)[number][];
