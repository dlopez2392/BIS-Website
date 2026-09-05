/**
 * The "first hour back" estimate.
 *
 * A calculator on a consultancy's site is a trust exercise before it is a
 * conversion one. Anyone can pick multipliers that produce a big number; the
 * number is worthless the moment a business owner asks where it came from and
 * nobody can answer. So every assumption here is a named constant with the
 * reasoning attached, all of them are shown on the page, and each is set at
 * the conservative end of what BIS would actually claim on a call.
 *
 * The output is deliberately hours first and money second. Hours are something
 * an owner can check against their own week. A dollar figure is a projection,
 * and it is only ever shown when they supply what an hour of their time is
 * worth, because a number BIS invented is a number BIS would have to defend.
 */

export interface EstimateInput {
  /** Calls that currently go unanswered in a normal week. */
  missedCallsPerWeek: number;
  /** Hours a week spent on repeatable admin: scheduling, intake, follow-up, retyping. */
  adminHoursPerWeek: number;
  /** What an hour of the owner's time is worth, in dollars. Zero means "do not guess". */
  hourlyValue: number;
  /** Share of customers who would rather be served in Spanish, 0-100. */
  spanishSharePercent: number;
}

/**
 * Share of missed calls a bilingual assistant actually converts into a booked
 * appointment or a captured lead. Not all of them: some callers want a
 * specific person, some hang up regardless, some were never customers. Four in
 * five is the conservative end of what BIS sees on its own line.
 */
export const CALL_CAPTURE_RATE = 0.8;

/**
 * Share of repeatable admin a first engagement removes. Deliberately about a
 * third, not "most": the first pass automates the one or two workflows with
 * the clearest rules, and the rest needs decisions a person still makes.
 */
export const ADMIN_AUTOMATION_RATE = 0.35;

/** Working weeks in a year, allowing two weeks off, so an annual figure is not 52 optimistic weeks. */
export const WORKING_WEEKS = 50;

/** Below this, a bilingual front door is a nice-to-have rather than the headline. */
export const SPANISH_SHARE_THRESHOLD = 25;

export interface Estimate {
  /** Calls a week that would be answered instead of missed. */
  callsAnswered: number;
  /** Hours a week handed back. */
  hoursPerWeek: number;
  hoursPerYear: number;
  /** Dollar value of those hours per year, or null when no hourly value was given. */
  valuePerYear: number | null;
  /** True when enough customers prefer Spanish that a bilingual front door leads the answer. */
  bilingualMatters: boolean;
  /** False when nothing was entered, so the page can stay quiet instead of claiming zero. */
  hasInput: boolean;
}

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, max);
}

export function estimate(input: EstimateInput): Estimate {
  const calls = clamp(input.missedCallsPerWeek, 200);
  const admin = clamp(input.adminHoursPerWeek, 80);
  const rate = clamp(input.hourlyValue, 1000);
  const spanish = clamp(input.spanishSharePercent, 100);

  const callsAnswered = Math.round(calls * CALL_CAPTURE_RATE);
  // Answered calls are counted as opportunities recovered, not as hours: the
  // time they take is the owner's to spend on a customer, which is the point.
  const hoursPerWeek = Math.round(admin * ADMIN_AUTOMATION_RATE * 10) / 10;
  const hoursPerYear = Math.round(hoursPerWeek * WORKING_WEEKS);

  return {
    callsAnswered,
    hoursPerWeek,
    hoursPerYear,
    valuePerYear: rate > 0 && hoursPerYear > 0 ? Math.round(hoursPerYear * rate) : null,
    bilingualMatters: spanish >= SPANISH_SHARE_THRESHOLD,
    hasInput: calls > 0 || admin > 0,
  };
}
