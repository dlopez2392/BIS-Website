/**
 * The service groups the site publishes, in order: the ids behind
 * `services.<id>Title` / `Body` / `Bullets` in messages/*.json. Structured
 * data lists one Service per id, so a group added to the copy without being
 * added here is simply not announced to search engines.
 */
export const SERVICE_GROUP_IDS = ['g1', 'g2', 'g3'] as const;
