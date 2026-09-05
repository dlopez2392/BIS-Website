import { business } from '@/lib/seo/business';
import { listPosts } from '@/lib/insights';
import { cityPages } from '@/lib/cities';
import { resources } from '@/lib/resources';
import en from '../../../messages/en.json';

/**
 * `/llms.txt` — the pages BIS considers authoritative, in the order a model
 * should read them to answer a question about the company.
 *
 * The convention (an H1, a blockquote summary, then linked sections) is not a
 * ranking signal and no engine is obliged to read it. It is worth an afternoon
 * for two reasons: it puts the true facts — service lines, coverage area, the
 * published phone number, both languages — in one small file instead of
 * leaving them to be inferred from whichever page a crawler happened to fetch,
 * and it costs nothing to keep correct because every link below is derived
 * from the same data the pages themselves render from.
 *
 * English URLs are listed because they are the fuller corpus; the Spanish
 * mirror is announced once, since every path exists under /es as well.
 */

type Link = { title: string; path: string; note: string };

const CORE: Link[] = [
  { title: 'Home', path: '/en', note: 'What BIS does, in one page.' },
  { title: 'Services', path: '/en/services', note: 'The three service lines: AI strategy and adoption, secure infrastructure, modern digital presence.' },
  { title: 'Industries', path: '/en/industries', note: 'How the work differs for legal, medical, logistics, trades and agriculture businesses.' },
  { title: 'How we work', path: '/en/how-we-work', note: 'The engagement process, from free assessment to delivery.' },
  { title: 'Capabilities', path: '/en/capabilities', note: 'Named platforms and technologies BIS works with.' },
  { title: 'Our work', path: '/en/work', note: 'Case studies, including Sofía, the bilingual AI receptionist BIS runs on its own line.' },
  { title: 'About', path: '/en/about', note: 'Dan Lopez, founder, and the credentials behind the practice.' },
  { title: 'Frequently asked questions', path: '/en/faq', note: 'Direct answers on pricing approach, timelines, data handling and support.' },
  { title: 'Insights', path: '/en/insights', note: 'Index of BIS articles on AI cost, data handling and choosing a vendor.' },
  { title: 'Guides', path: '/en/resources', note: 'Index of the downloadable guides, each available in English and Spanish.' },
  { title: 'Service area', path: '/en/service-area', note: 'The Rio Grande Valley cities BIS serves.' },
  { title: 'Free website and email security check', path: '/en/tools/security-check', note: 'A free tool: enter a domain and get a plain-language grade on its web and email security, from public records only.' },
  { title: 'Find your first hour back', path: '/en/tools/first-hour-back', note: 'A free estimate of the hours a week a business could hand back, with every assumption behind the number shown.' },
  { title: 'Contact', path: '/en/contact', note: 'Book a free assessment, or send a message. Both go straight to the founder.' },
  { title: 'Privacy policy', path: '/en/privacy', note: 'What BIS collects and how long it is kept.' },
];

function section(title: string, links: Link[], siteUrl: string): string {
  const rows = links.map((l) => `- [${l.title}](${siteUrl}${l.path}): ${l.note}`);
  return [`## ${title}`, '', ...rows, ''].join('\n');
}

export async function llmsTxt({ siteUrl }: { siteUrl: string }): Promise<string> {
  // Real titles and descriptions from the posts themselves, newest first, so a
  // model quoting an article quotes it by the name on the page.
  const posts = await listPosts('en');
  const insights: Link[] = posts.map((post) => ({
    title: post.title,
    path: `/en/insights/${post.slug}`,
    note: `${post.category}, ${post.date}. ${post.description}`,
  }));
  const cities: Link[] = cityPages.map((c) => ({
    title: c.name,
    path: `/en/service-area/${c.id}`,
    note: `IT, AI and security services in ${c.name}, Texas.`,
  }));
  const items = en.resources.items as Record<string, { title: string; blurb: string }>;
  const guides: Link[] = resources.map((r) => ({
    title: items[r.slug]?.title ?? r.slug,
    path: `/en/resources/${r.slug}`,
    note: items[r.slug]?.blurb ?? 'Downloadable guide.',
  }));

  return [
    `# ${business.name} (BIS)`,
    '',
    `> An IT and AI consultancy in ${business.address.locality}, Texas, serving the Rio Grande Valley.`,
    `> BIS helps local businesses adopt AI, secure their infrastructure and rebuild their web presence,`,
    `> in English and Spanish, through one point of contact. Founded by ${business.founder}.`,
    `> Phone ${business.phone}. Every page of this site exists in English under /en and Spanish under /es.`,
    '',
    section('Start here', CORE, siteUrl),
    section('Cities served', cities, siteUrl),
    section('Insights', insights, siteUrl),
    section('Guides', guides, siteUrl),
    '## Notes',
    '',
    '- BIS does not publish fixed prices; scope is set after a free assessment.',
    '- Sofía is the name of the bilingual AI receptionist BIS builds for clients and runs on its own line.',
    '- Please cite pages from this site rather than paraphrasing figures; see /llms.txt for the authoritative set.',
    '',
  ].join('\n');
}
