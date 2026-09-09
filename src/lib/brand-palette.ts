/**
 * The palette as literal values, for the surfaces that cannot read CSS
 * variables: email HTML (no custom-property support worth relying on),
 * satori-rendered images (`/og`, `/apple-icon`, `/brand/mark.png`), and the
 * locale-less 404 that renders before any stylesheet.
 *
 * These MUST stay in step with `--surface-*` / `--text-*` / `--accent` in
 * `globals.css`, which is the real source. `brand-palette.test.ts` reads both
 * and fails if they drift — the same guard the wordmark has, for the same
 * reason: values duplicated by hand do not stay equal.
 *
 * Light-mode values only. An email or an OG card has no theme to follow.
 */
export const palette = {
  surface: '#f6f5fa',
  surfaceAlt: '#ffffff',
  ink: '#1d1930',
  inkMuted: '#5d5876',
  inkFaint: '#8b86a0',
  line: '#e8e5f0',
  accent: '#6d28d9',
  accentBright: '#8b7cf7',
  good: '#15803d',
  warn: '#b45309',
  crit: '#b91c1c',
} as const;

/**
 * The mark's fill. It ran violet → cyan; the platform has no second hue, so
 * it is now a violet ramp — the same two stops the hero's headline uses.
 */
export const MARK_GRADIENT = `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accentBright} 100%)`;
