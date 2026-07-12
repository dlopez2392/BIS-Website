// Category → ordered question ids. Text lives in the `faq` i18n namespace
// (faq.items.<id>.q / .a); headings in faq.categories.<id>.
export const faqCategories = [
  { id: 'general', items: ['whatIsBis', 'whoServe', 'bespoke'] },
  { id: 'ai', items: ['aiPractical', 'aiCost'] },
  { id: 'security', items: ['dataHandling', 'compliance'] },
  { id: 'web', items: ['ownWebsite', 'webWhat'] },
  { id: 'working', items: ['howStart', 'pricing', 'remote'] },
] as const;

export const faqItemIds: string[] = faqCategories.flatMap((c) => [...c.items]);
