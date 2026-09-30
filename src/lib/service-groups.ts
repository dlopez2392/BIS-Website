/**
 * The service groups the site publishes, in order: the ids behind
 * `services.<id>Title` / `Body` / `Bullets` in messages/*.json. Structured
 * data lists one Service per id, so a group added to the copy without being
 * added here is simply not announced to search engines.
 */
export const SERVICE_GROUP_IDS = ['g1', 'g2', 'g3'] as const;

/**
 * Where each group can be linked to on /services. The home page's service
 * cards and the footer both point at a group, not at the top of the page, so
 * "AI Strategy" lands on AI rather than on whatever the page leads with.
 */
export const SERVICE_ANCHORS = { g1: 'ai', g2: 'infrastructure', g3: 'web' } as const satisfies Record<(typeof SERVICE_GROUP_IDS)[number], string>;
