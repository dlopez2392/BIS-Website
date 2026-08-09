/**
 * Minimal Cal.com v2 client — just the two operations the site assistant needs.
 *
 * Deliberately a port, not a shared package: the reception repo (Sofía) has a
 * fuller adapter, but these are two independent deploys and coupling them would
 * mean a monorepo migration for two endpoints. That repo already duplicates its
 * notification HTTP call for the same reason.
 *
 * The version pins below are per-endpoint and verified against live Cal — a 404
 * from this API almost always means a wrong `cal-api-version`, not a missing
 * route. Do not "modernise" them without re-verifying against the real API.
 */

const BASE = 'https://api.cal.com/v2';
const V_SLOTS = '2024-09-04';
const V_BOOKINGS = '2026-02-25';
const DEFAULT_TIMEOUT_MS = 10_000;

export class CalError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'CalError';
  }
}

export interface CalConfig {
  apiKey: string;
  username: string;
  eventSlug: string;
}

export interface CalOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** Throws rather than returning a partial config, so the tool can degrade to the booking link. */
export function calConfigFromEnv(env: Record<string, string | undefined> = process.env): CalConfig {
  const apiKey = env.CAL_API_KEY?.trim();
  const username = env.CAL_USERNAME?.trim();
  const eventSlug = env.CAL_EVENT_SLUG?.trim();
  if (!apiKey) throw new CalError('CAL_API_KEY is not set');
  if (!username) throw new CalError('CAL_USERNAME is not set');
  if (!eventSlug) throw new CalError('CAL_EVENT_SLUG is not set');
  return { apiKey, username, eventSlug };
}

/** Cal's phone field accepts E.164 and nothing else. Returns null when it can't be formed. */
function toE164(input: string | undefined): string | undefined {
  const digits = (input ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return undefined;
}

const toUtcIso = (value: string) => new Date(value).toISOString();

async function calRequest<T>(
  cfg: CalConfig,
  o: { path: string; method: 'GET' | 'POST'; version: string; query?: Record<string, string>; body?: unknown },
  opts: CalOptions = {},
): Promise<T> {
  const doFetch = opts.fetchImpl ?? fetch;
  const url = new URL(BASE + o.path);
  for (const [k, v] of Object.entries(o.query ?? {})) if (v) url.searchParams.set(k, v);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await doFetch(url.toString(), {
      method: o.method,
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        'cal-api-version': o.version,
        'content-type': 'application/json',
      },
      ...(o.body ? { body: JSON.stringify(o.body) } : {}),
      signal: controller.signal,
    });
  } catch (err) {
    throw new CalError(`Cal.com request to ${o.path} failed: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = undefined;
  }

  if (!res.ok) {
    const detail =
      (parsed as { error?: { message?: string } } | undefined)?.error?.message ?? text.slice(0, 200);
    if (res.status === 404) {
      throw new CalError(
        `Cal.com returned 404 for ${o.path} — check the cal-api-version header (sent "${o.version}"): ${detail}`,
        404,
      );
    }
    throw new CalError(`Cal.com ${res.status} for ${o.path}: ${detail}`, res.status);
  }

  return (parsed as { data?: T })?.data as T;
}

interface SlotsResponse {
  [date: string]: Array<{ start: string }>;
}

/** Available starts for a day, as UTC ISO strings, chronological. */
export async function listSlots(
  cfg: CalConfig,
  q: { date: string; timeZone: string },
  opts: CalOptions = {},
): Promise<string[]> {
  const data = await calRequest<SlotsResponse>(
    cfg,
    {
      path: '/slots',
      method: 'GET',
      version: V_SLOTS,
      query: {
        eventTypeSlug: cfg.eventSlug,
        username: cfg.username,
        start: q.date,
        end: q.date,
        timeZone: q.timeZone,
      },
    },
    opts,
  );

  return Object.keys(data ?? {})
    .sort()
    // Cal answers in the requested zone's offset; everything downstream speaks UTC.
    .flatMap((date) => (data[date] ?? []).map((s) => toUtcIso(s.start)))
    .sort((a, b) => a.localeCompare(b));
}

export interface BookInput {
  startsAt: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  timeZone: string;
  language: 'en' | 'es';
}

export async function book(
  cfg: CalConfig,
  input: BookInput,
  opts: CalOptions = {},
): Promise<{ uid: string; startsAt: string }> {
  const email = input.email?.trim() || undefined;
  // A half-typed phone number must never cost the visitor their appointment —
  // the web event requires email, so phone is a bonus. Drop what Cal can't take.
  const phone = toE164(input.phone);

  if (!email && !phone) {
    throw new CalError('A booking needs an email address or a phone number.');
  }

  const data = await calRequest<{ uid: string; start: string }>(
    cfg,
    {
      path: '/bookings',
      method: 'POST',
      version: V_BOOKINGS,
      body: {
        eventTypeSlug: cfg.eventSlug,
        username: cfg.username,
        start: toUtcIso(input.startsAt),
        attendee: {
          name: input.name,
          ...(email ? { email } : {}),
          ...(phone ? { phoneNumber: phone } : {}),
          timeZone: input.timeZone,
          language: input.language,
        },
        ...(input.notes ? { bookingFieldsResponses: { notes: input.notes } } : {}),
        metadata: { source: 'website-chat' },
      },
    },
    opts,
  );

  return { uid: data.uid, startsAt: toUtcIso(data.start) };
}
