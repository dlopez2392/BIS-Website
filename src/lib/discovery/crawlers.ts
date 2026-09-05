/**
 * How this site answers AI crawlers.
 *
 * Two different jobs hide behind the phrase "AI crawler", and BIS wants
 * opposite answers for each:
 *
 *   Answer engines fetch a page so they can quote and cite it in a reply.
 *   Being cited there is now a real source of enquiries, so they are welcome.
 *
 *   Training crawlers collect pages into model training sets. Nothing here
 *   comes back to BIS from that, so they are declined.
 *
 * The Content-Signal line states the same preference for the crawlers that
 * read it rather than a per-agent rule, using the convention Cloudflare rolled
 * out across several million domains in 2026. Signals are a stated preference,
 * not an enforcement mechanism — the per-agent rules below are what actually
 * gets obeyed by operators who honour robots.txt at all.
 */

/** Fetch a page to answer a person's question, and cite it. Welcome. */
export const ANSWER_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  // Google-Extended is a single switch covering both Gemini grounding and
  // Gemini training. Disallowing it would take BIS out of Gemini's answers to
  // buy a training exclusion Google already honours through other controls;
  // for a firm that needs to be found, visibility is worth more.
  'Google-Extended',
] as const;

/** Collect pages into training sets. Declined, where declining costs no visibility. */
export const TRAINING_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'Applebot-Extended',
  'meta-externalagent',
  'Bytespider',
  'CCBot',
] as const;

export const CONTENT_SIGNAL = 'Content-Signal: search=yes, ai-input=yes, ai-train=no';

export function robotsTxt({ siteUrl }: { siteUrl: string }): string {
  const lines: string[] = [
    '# Bespoke Intelligent Solutions — bis-rgv.com',
    '#',
    '# Content signals (https://contentsignals.org):',
    '#   search=yes    index these pages and link to them',
    '#   ai-input=yes  quote and cite them when answering a question',
    '#   ai-train=no   do not collect them into a model training set',
    CONTENT_SIGNAL,
    '',
    'User-Agent: *',
    'Allow: /',
    // Nothing under /api is a page. Keeping crawlers off it saves the chat
    // endpoint from being walked and costs no visibility.
    'Disallow: /api/',
    '',
    '# Answer engines: welcome, so BIS can be cited in AI answers.',
  ];
  for (const agent of ANSWER_CRAWLERS) {
    lines.push(`User-Agent: ${agent}`, 'Allow: /', 'Disallow: /api/', '');
  }
  lines.push('# Training crawlers: declined, per the ai-train signal above.');
  for (const agent of TRAINING_CRAWLERS) {
    lines.push(`User-Agent: ${agent}`, 'Disallow: /', '');
  }
  lines.push(`Sitemap: ${siteUrl}/sitemap.xml`, '');
  return lines.join('\n');
}
