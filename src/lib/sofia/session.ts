/**
 * The decisions behind the "Talk to Sofía" button, kept out of the component
 * so they can be tested without a browser, a microphone or a network.
 *
 * The component owns only the imperative WebRTC choreography, which is four
 * lines of OpenAI's documented dance; everything that can be wrong in an
 * interesting way — what a failure means to a visitor, what counts as
 * transcript, when to stop — is here.
 */

/** What went wrong, in the terms the visitor is told about. Deliberately
 *  coarse: a visitor needs to know whether to try again, wait, or pick up the
 *  phone, and nothing else. Diagnostics go to the server logs. */
export type SofiaFailure =
  | 'unsupported'   // this browser cannot do it at all
  | 'mic_denied'    // they said no, or there is no input device
  | 'rate_limited'  // they have had their turn for now
  | 'unavailable';  // our side is down or unconfigured

export type TicketResponse = { ticket: string; sessionUrl: string };

/**
 * Maps a ticket-endpoint response to either a usable ticket or the reason a
 * visitor is not getting one. A 429 is its own thing because it is the only
 * failure where "try again later" is honest advice.
 */
export function readTicketResponse(
  status: number, body: unknown,
): { ok: true; value: TicketResponse } | { ok: false; failure: SofiaFailure } {
  if (status === 429) return { ok: false, failure: 'rate_limited' };
  if (status !== 200) return { ok: false, failure: 'unavailable' };
  const b = body as Partial<TicketResponse> | null;
  if (!b || typeof b.ticket !== 'string' || typeof b.sessionUrl !== 'string' || !b.ticket || !b.sessionUrl) {
    return { ok: false, failure: 'unavailable' };
  }
  return { ok: true, value: { ticket: b.ticket, sessionUrl: b.sessionUrl } };
}

/** getUserMedia rejects with a DOMException whose `name` is the only stable
 *  part. Anything that is not an outright refusal is still, to the visitor, a
 *  microphone that did not work. */
export function readMicError(err: unknown): SofiaFailure {
  const name = (err as { name?: unknown } | null)?.name;
  return name === 'NotAllowedError' || name === 'SecurityError' || name === 'NotFoundError'
    ? 'mic_denied'
    : 'unavailable';
}

export type TranscriptLine = { role: 'sofia' | 'visitor'; text: string };

/**
 * The two Realtime events worth showing, and nothing else.
 *
 * A running caption is not decoration here: it is what lets a deaf or
 * hard-of-hearing visitor use this at all, and what lets anyone in a quiet
 * office judge Sofía without turning the sound on. Partial deltas are ignored
 * in favour of the `.done` events so the panel does not flicker a half-word
 * at a screen reader.
 */
export function transcriptFromEvent(event: unknown): TranscriptLine | null {
  const e = event as { type?: unknown; transcript?: unknown } | null;
  if (!e || typeof e.type !== 'string' || typeof e.transcript !== 'string') return null;
  const text = e.transcript.trim();
  if (!text) return null;
  if (e.type === 'response.output_audio_transcript.done') return { role: 'sofia', text };
  if (e.type === 'conversation.item.input_audio_transcription.completed') return { role: 'visitor', text };
  return null;
}

/** Whole seconds left, never negative, never above the ceiling — a clock that
 *  jumps backwards (a laptop waking) must not print a number larger than the
 *  session was ever allowed to be. */
export function secondsRemaining(startedAtMs: number, nowMs: number, maxSeconds: number): number {
  const elapsed = Math.floor((nowMs - startedAtMs) / 1000);
  return Math.min(maxSeconds, Math.max(0, maxSeconds - elapsed));
}

/** `m:ss`. */
export function formatRemaining(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Whether the browser can do this at all, checked before anything is
 *  promised: no microphone API, or no WebRTC, means the button should say so
 *  rather than fail after asking for permission. */
export function browserSupported(win: {
  RTCPeerConnection?: unknown;
  navigator?: { mediaDevices?: { getUserMedia?: unknown } };
}): boolean {
  return typeof win.RTCPeerConnection === 'function'
    && typeof win.navigator?.mediaDevices?.getUserMedia === 'function';
}
