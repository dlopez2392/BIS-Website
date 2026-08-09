import { describe, it, expect } from 'vitest';
import { calConfigFromEnv, listSlots } from '../cal';

/**
 * Read-only probe against the real Cal.com API. Opt in:
 *
 *   CAL_LIVE_TEST=1 CAL_API_KEY=... CAL_USERNAME=dan-lopez-utygjo \
 *   CAL_EVENT_SLUG=free-assessment npm test -- src/lib/__tests__/cal.live.test.ts
 *
 * It asks for availability and nothing else, so it proves the API key, the
 * event slug and the version pin together without creating a booking anyone
 * has to cancel. Never set CAL_LIVE_TEST in CI.
 */
const live = process.env.CAL_LIVE_TEST === '1';

describe.skipIf(!live)('Cal.com, against the real API', () => {
  it('returns availability for the web event type', async () => {
    const cfg = calConfigFromEnv();
    const date = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);

    const slots = await listSlots(cfg, { date, timeZone: 'America/Chicago' });

    console.log(`[live] ${slots.length} slot(s) on ${date}; first: ${slots[0] ?? '(none)'}`);
    expect(Array.isArray(slots)).toBe(true);
    // Every start must already be UTC — the rest of the flow assumes it.
    for (const start of slots) expect(start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  }, 20_000);
});
