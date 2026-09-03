import { routing } from '@/i18n/routing';

export type Locale = (typeof routing.locales)[number];

export const PATH_MAX_CHARS = 200;

// Built from routing.locales so adding a locale never means editing a regex
// literal. Matches '/en', '/es/capabilities', '/en/insights/some-slug'.
const PATH_PATTERN = new RegExp(`^/(${routing.locales.join('|')})(/[a-z0-9\\-/]*)?$`);

export interface VisitorContext {
  locale: Locale;
  path?: string;
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
  const input = (raw ?? {}) as { locale?: unknown; path?: unknown };
  const locale: Locale = isLocale(input.locale) ? input.locale : routing.defaultLocale;
  const path =
    typeof input.path === 'string' && input.path.length <= PATH_MAX_CHARS && PATH_PATTERN.test(input.path)
      ? input.path
      : undefined;
  return { locale, path };
}
