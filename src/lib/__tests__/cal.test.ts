import { describe, it, expect, vi } from 'vitest';
import { calConfigFromEnv, listSlots, book, CalError } from '../cal';

const cfg = {
  apiKey: 'cal_test_key',
  username: 'dan-lopez-utygjo',
  eventSlug: 'free-assessment',
};

function fakeFetch(status: number, payload: unknown) {
  // Signature must match fetch's, or tsc rejects passing it as fetchImpl —
  // vitest alone would not have caught that.
  return vi.fn(
    async (_url: URL | RequestInfo, _init?: RequestInit) =>
      new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } }),
  );
}

const lastCall = (f: ReturnType<typeof fakeFetch>) => {
  const [url, init] = f.mock.calls[0];
  return {
    url: new URL(String(url)),
    init: init as RequestInit,
    headers: (init as RequestInit).headers as Record<string, string>,
  };
};

describe('calConfigFromEnv', () => {
  it('reads the three values it needs', () => {
    const c = calConfigFromEnv({ CAL_API_KEY: 'k', CAL_USERNAME: 'u', CAL_EVENT_SLUG: 's' });
    expect(c).toEqual({ apiKey: 'k', username: 'u', eventSlug: 's' });
  });

  it('throws a recognisable error when the key is missing, so the tool can degrade', () => {
    expect(() => calConfigFromEnv({ CAL_USERNAME: 'u', CAL_EVENT_SLUG: 's' })).toThrow(CalError);
    expect(() => calConfigFromEnv({ CAL_API_KEY: 'k', CAL_EVENT_SLUG: 's' })).toThrow(/CAL_USERNAME/);
  });
});

describe('listSlots', () => {
  const payload = {
    '2026-08-12': [{ start: '2026-08-12T13:00:00.000Z' }, { start: '2026-08-12T14:00:00.000Z' }],
    '2026-08-11': [{ start: '2026-08-11T15:00:00-05:00' }],
  };

  it('sends the slots API version and the event identity', async () => {
    const f = fakeFetch(200, { data: payload });
    await listSlots(cfg, { date: '2026-08-12', timeZone: 'America/Chicago' }, { fetchImpl: f });
    const { url, headers } = lastCall(f);
    expect(url.pathname).toBe('/v2/slots');
    // Pinned per endpoint and verified live — Cal v2 versions differ by route.
    expect(headers['cal-api-version']).toBe('2024-09-04');
    expect(headers.Authorization).toBe('Bearer cal_test_key');
    expect(url.searchParams.get('eventTypeSlug')).toBe('free-assessment');
    expect(url.searchParams.get('username')).toBe('dan-lopez-utygjo');
    expect(url.searchParams.get('timeZone')).toBe('America/Chicago');
  });

  it('flattens every date, normalises to UTC, and sorts chronologically', async () => {
    const f = fakeFetch(200, { data: payload });
    const slots = await listSlots(cfg, { date: '2026-08-11', timeZone: 'America/Chicago' }, { fetchImpl: f });
    expect(slots).toEqual([
      '2026-08-11T20:00:00.000Z', // the -05:00 offset Cal returned, in UTC
      '2026-08-12T13:00:00.000Z',
      '2026-08-12T14:00:00.000Z',
    ]);
  });

  it('returns an empty list when the day is fully booked', async () => {
    const f = fakeFetch(200, { data: {} });
    expect(await listSlots(cfg, { date: '2026-08-12', timeZone: 'UTC' }, { fetchImpl: f })).toEqual([]);
  });
});

describe('book', () => {
  const ok = { data: { uid: 'abc123', start: '2026-08-12T13:00:00.000Z' } };
  const input = {
    startsAt: '2026-08-12T13:00:00.000Z',
    name: 'Dan Lopez',
    email: 'dan@example.com',
    timeZone: 'America/Chicago',
    language: 'en' as const,
  };

  it('posts the booking with the bookings API version', async () => {
    const f = fakeFetch(200, ok);
    const res = await book(cfg, input, { fetchImpl: f });
    const { url, init, headers } = lastCall(f);
    expect(url.pathname).toBe('/v2/bookings');
    expect(init.method).toBe('POST');
    expect(headers['cal-api-version']).toBe('2026-02-25');
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      eventTypeSlug: 'free-assessment',
      username: 'dan-lopez-utygjo',
      start: '2026-08-12T13:00:00.000Z',
      attendee: { name: 'Dan Lopez', email: 'dan@example.com', timeZone: 'America/Chicago', language: 'en' },
    });
    expect(res).toEqual({ uid: 'abc123', startsAt: '2026-08-12T13:00:00.000Z' });
  });

  it('normalises a typed phone number to E.164, which is all Cal accepts', async () => {
    const f = fakeFetch(200, ok);
    await book(cfg, { ...input, phone: '(956) 292-1696' }, { fetchImpl: f });
    const body = JSON.parse(String(lastCall(f).init.body));
    expect(body.attendee.phoneNumber).toBe('+19562921696');
  });

  it('drops an unusable phone number rather than failing the booking', async () => {
    // Email is what the web event requires; a half-typed phone must not cost
    // the visitor their appointment.
    const f = fakeFetch(200, ok);
    await book(cfg, { ...input, phone: '555' }, { fetchImpl: f });
    const body = JSON.parse(String(lastCall(f).init.body));
    expect(body.attendee.phoneNumber).toBeUndefined();
  });

  it('includes notes only when there are notes', async () => {
    const withNotes = fakeFetch(200, ok);
    await book(cfg, { ...input, notes: 'wants help with intake' }, { fetchImpl: withNotes });
    expect(JSON.parse(String(lastCall(withNotes).init.body)).bookingFieldsResponses).toEqual({
      notes: 'wants help with intake',
    });

    const without = fakeFetch(200, ok);
    await book(cfg, input, { fetchImpl: without });
    expect(JSON.parse(String(lastCall(without).init.body)).bookingFieldsResponses).toBeUndefined();
  });

  it('refuses when there is no contact method at all', async () => {
    const f = fakeFetch(200, ok);
    await expect(book(cfg, { ...input, email: undefined }, { fetchImpl: f })).rejects.toThrow(/email|phone/i);
    expect(f).not.toHaveBeenCalled();
  });

  it('surfaces the API detail on failure instead of a bare status', async () => {
    const f = fakeFetch(400, { error: { message: 'no_available_users_found_error' } });
    await expect(book(cfg, input, { fetchImpl: f })).rejects.toThrow(/no_available_users_found_error/);
  });

  it('explains a 404 as a version-header problem, which is what it almost always is', async () => {
    const f = fakeFetch(404, { error: { message: 'Not Found' } });
    await expect(book(cfg, input, { fetchImpl: f })).rejects.toThrow(/cal-api-version/);
  });
});
