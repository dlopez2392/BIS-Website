import { heroShot, shotSrc, tourShot } from '@/lib/platform-tour';
import { PRISM_URL } from '@/lib/work';
import type { FocusId } from './focus';

/**
 * What an example IS, said on its card as a dot and a word:
 *   live    — ours, running now, and the link opens it;
 *   client  — a site we built for a client who is named, with their say-so;
 *   demo    — a full site we built for a business that does not exist, which
 *             says so on its own pages;
 *   concept — a picture of something we could build: our own screen design
 *             with sample data, over a photograph made with AI. The section
 *             says so under the cards.
 * The page promises every example says which it is, so nothing here is
 * unlabelled, and a concept is never worded as delivered work.
 */
export type ExampleStatus = 'live' | 'client' | 'demo' | 'concept';
export const EXAMPLE_STATUSES = ['live', 'client', 'demo', 'concept'] as const satisfies readonly ExampleStatus[];

export interface WorkExample {
  /** Also the key under `home.examples.items`. */
  id: string;
  area: FocusId;
  status: ExampleStatus;
  src: string;
  width: number;
  height: number;
  href: string;
  external?: boolean;
}

const EX = { width: 1600, height: 1000 };
const ex = (name: string, version = 1) => `/work/examples/${name}.${version}.webp`;

/**
 * The examples on the home page, in the order they are shown. The two
 * platform captures follow the page's language (see `shotSrc`).
 */
export function workExamples(locale: string): WorkExample[] {
  const call = tourShot('spanish');
  return [
    { id: 'sofia', area: 'ai', status: 'live', src: shotSrc(call, locale), width: call.width, height: call.height, href: '/work#sofia' },
    { id: 'platform', area: 'apps', status: 'live', src: shotSrc(heroShot, locale), width: heroShot.width, height: heroShot.height, href: '/platform' },
    { id: 'prism', area: 'apps', status: 'live', src: '/work/prism/overview-desktop-dark.1.webp', width: 1600, height: 1000, href: PRISM_URL, external: true },
    { id: 'woodworks', area: 'web', status: 'client', src: ex('woodworks-956'), ...EX, href: 'https://956woodworks.com', external: true },
    { id: 'rlc', area: 'web', status: 'client', src: ex('rlc-lumber'), ...EX, href: 'https://rlclumber.com', external: true },
    { id: 'securityCheck', area: 'security', status: 'live', src: ex('security-check'), ...EX, href: '/tools/security-check' },
    { id: 'vela', area: 'web', status: 'demo', src: ex('vela-ortiz-demo'), ...EX, href: 'https://vela-ortiz-demo.vercel.app', external: true },
    { id: 'sunroom', area: 'ai', status: 'demo', src: ex('sunroom-demo'), ...EX, href: 'https://sunroom-childcare-demo.vercel.app', external: true },
    { id: 'conceptIt', area: 'it', status: 'concept', src: ex('concept-it-report', 2), ...EX, href: '/contact' },
    { id: 'conceptApp', area: 'apps', status: 'concept', src: ex('concept-field-app', 2), ...EX, href: '/contact' },
    { id: 'conceptAi', area: 'ai', status: 'concept', src: ex('concept-ai-intake', 2), ...EX, href: '/contact' },
    { id: 'conceptSecurity', area: 'security', status: 'concept', src: ex('concept-phishing-drill', 2), ...EX, href: '/contact' },
  ];
}

/** Text keys every example must define in both locales. */
export const exampleTextKeys = ['title', 'body', 'link', 'alt'] as const;
