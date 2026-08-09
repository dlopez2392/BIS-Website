import { routing } from '@/i18n/routing';

export type Locale = (typeof routing.locales)[number];

export const PATH_MAX_CHARS = 200;

// Built from routing.locales so adding a locale never means editing a regex
// literal. Matches '/en', '/es/capabilities', '/en/insights/some-slug'.
const PATH_PATTERN = new RegExp(`^/(${routing.locales.join('|')})(/[a-z0-9\\-/]*)?$`);

export const TIMEZONE_MAX_CHARS = 64;

/** Falls back to the business's own zone, which is where the appointments are. */
export const DEFAULT_TIME_ZONE = 'America/Chicago';

export interface VisitorContext {
  locale: Locale;
  path?: string;
  /** IANA zone the visitor is in — decides what "tomorrow at 2" means to them. */
  timeZone: string;
}

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (routing.locales as readonly string[]).includes(value);
}

/**
 * Validates client-supplied chat context. `path` reaches the system prompt, so
 * anything off-pattern is dropped rather than sanitised — a crafted value must
 * never become prompt text.
 */
export function resolveVisitorContext(raw: unknown): VisitorContext {
  const input = (raw ?? {}) as { locale?: unknown; path?: unknown; timeZone?: unknown };
  const locale: Locale = isLocale(input.locale) ? input.locale : routing.defaultLocale;
  const path =
    typeof input.path === 'string' && input.path.length <= PATH_MAX_CHARS && PATH_PATTERN.test(input.path)
      ? input.path
      : undefined;
  return { locale, path, timeZone: resolveTimeZone(input.timeZone) };
}

/**
 * Asks Intl whether the zone is real rather than pattern-matching it: the list
 * of IANA zones changes, and a made-up-but-plausible string would otherwise
 * reach Cal.com and be rejected there, at booking time, in front of a visitor.
 */
function resolveTimeZone(value: unknown): string {
  if (typeof value !== 'string' || value.length > TIMEZONE_MAX_CHARS) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return value;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}
