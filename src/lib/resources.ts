export interface Resource {
  slug: string;
  files: { en: string; es: string }; // public paths
}

export const resources: Resource[] = [
  {
    slug: 'ai-readiness-checklist',
    files: {
      en: '/resources/ai-readiness-checklist-en.pdf',
      es: '/resources/ai-readiness-checklist-es.pdf',
    },
  },
  {
    slug: 'cybersecurity-guide',
    files: {
      en: '/resources/cybersecurity-guide-en.pdf',
      es: '/resources/cybersecurity-guide-es.pdf',
    },
  },
];

export function getResource(slug: string): Resource | undefined {
  return resources.find((r) => r.slug === slug);
}
