import { CALL_CAPTURE_RATE } from './hours';

/**
 * The home page's missed-calls estimate — the compact, decide-now cousin of
 * the "first hour back" tool (`./hours.ts`), and held to the same rule: every
 * assumption is a named constant shown on the page, set at the conservative
 * end, and money appears only once the owner has said what a job is worth.
 * A dollar figure BIS picked would be a figure BIS has to defend.
 *
 * It shares `CALL_CAPTURE_RATE` with the full tool rather than restating it,
 * so the two calculators on one site can never disagree about how many missed
 * calls Sofía would have answered.
 */

export interface MissedCallsInput {
  /** Real customer calls a week — robocalls left out, which the page asks for. */
  callsPerWeek: number;
  /** Share of those that go unanswered, 0-100. */
  missedPercent: number;
  /** Average job, in dollars. Zero means "not set", and no money is shown. */
  jobValue: number;
}

/** 52 weeks over 12 months, so a month is not a flattering four and a half weeks or a stingy four. */
export const WEEKS_PER_MONTH = 52 / 12;

/**
 * Of the calls an owner misses, the share counted as a job they would have
 * won. One in four, on purpose: some callers try again, some were only asking,
 * some were never going to buy. Most owners would put their own number
 * higher, and the page tells them that rather than assuming it for them.
 */
export const JOB_SHARE = 0.25;

export interface MissedCallsEstimate {
  /** Calls a month that ring out. */
  missedPerMonth: number;
  /** Of those, jobs a month that walk to whoever picked up. */
  jobsPerMonth: number;
  /** Dollars a month those jobs are worth, or null until a job value is given. */
  lostPerMonth: number | null;
  /** The part Sofía would have answered, or null with no job value. */
  recoverablePerMonth: number | null;
  /** False with nothing entered, so the page stays quiet instead of claiming zero. */
  hasInput: boolean;
}

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, max);
}

export function missedCalls(input: MissedCallsInput): MissedCallsEstimate {
  const calls = clamp(input.callsPerWeek, 500);
  const share = clamp(input.missedPercent, 100) / 100;
  const job = clamp(input.jobValue, 100_000);

  const missed = calls * share * WEEKS_PER_MONTH;
  const jobs = missed * JOB_SHARE;
  // Rounded from the unrounded counts, so the dollars do not jump in steps of
  // one whole job as a slider moves.
  const lost = job > 0 && missed > 0 ? Math.round(jobs * job) : null;

  return {
    missedPerMonth: Math.round(missed),
    jobsPerMonth: Math.round(jobs * 10) / 10,
    lostPerMonth: lost,
    recoverablePerMonth: lost === null ? null : Math.round(lost * CALL_CAPTURE_RATE),
    hasInput: missed > 0,
  };
}
