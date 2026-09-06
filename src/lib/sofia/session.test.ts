import { describe, it, expect } from 'vitest';
import {
  readTicketResponse, readMicError, transcriptFromEvent,
  secondsRemaining, formatRemaining, browserSupported,
} from './session';

describe('readTicketResponse', () => {
  const good = { ticket: 't', sessionUrl: 'https://app.example/session' };

  it('accepts a complete ticket', () => {
    expect(readTicketResponse(200, good)).toEqual({ ok: true, value: good });
  });

  it('calls 429 rate_limited — the one failure where waiting is honest advice', () => {
    expect(readTicketResponse(429, {})).toEqual({ ok: false, failure: 'rate_limited' });
  });

  it('treats 403 as unavailable rather than telling a visitor they look like a bot', () => {
    expect(readTicketResponse(403, {})).toEqual({ ok: false, failure: 'unavailable' });
  });

  it('treats an unconfigured 503 as unavailable', () => {
    expect(readTicketResponse(503, { error: 'unavailable' })).toEqual({ ok: false, failure: 'unavailable' });
  });

  it.each([
    ['no body', null],
    ['missing sessionUrl', { ticket: 't' }],
    ['missing ticket', { sessionUrl: 'https://x' }],
    ['empty ticket', { ticket: '', sessionUrl: 'https://x' }],
    ['empty sessionUrl', { ticket: 't', sessionUrl: '' }],
    ['wrong types', { ticket: 1, sessionUrl: 2 }],
  ])('refuses a 200 whose body is unusable (%s)', (_label, body) => {
    expect(readTicketResponse(200, body)).toEqual({ ok: false, failure: 'unavailable' });
  });
});

describe('readMicError', () => {
  it.each(['NotAllowedError', 'SecurityError', 'NotFoundError'])(
    'treats %s as the visitor having no working microphone', (name) => {
      expect(readMicError(Object.assign(new Error('x'), { name }))).toBe('mic_denied');
    });

  it('treats anything else as our problem, not theirs', () => {
    expect(readMicError(Object.assign(new Error('x'), { name: 'AbortError' }))).toBe('unavailable');
  });

  it('does not throw on a non-error', () => {
    expect(readMicError(null)).toBe('unavailable');
    expect(readMicError('nope')).toBe('unavailable');
  });
});

describe('transcriptFromEvent', () => {
  it("attributes the model's finished transcript to Sofía", () => {
    expect(transcriptFromEvent({ type: 'response.output_audio_transcript.done', transcript: 'Hello there' }))
      .toEqual({ role: 'sofia', text: 'Hello there' });
  });

  it("attributes the completed input transcription to the visitor", () => {
    expect(transcriptFromEvent({ type: 'conversation.item.input_audio_transcription.completed', transcript: 'Hi' }))
      .toEqual({ role: 'visitor', text: 'Hi' });
  });

  it('ignores partial deltas, so the caption does not flicker half-words', () => {
    expect(transcriptFromEvent({ type: 'response.output_audio_transcript.delta', transcript: 'Hel' })).toBeNull();
  });

  it('ignores whitespace-only transcripts', () => {
    expect(transcriptFromEvent({ type: 'response.output_audio_transcript.done', transcript: '   ' })).toBeNull();
  });

  it('trims what it does return', () => {
    expect(transcriptFromEvent({ type: 'response.output_audio_transcript.done', transcript: '  hi  ' })?.text).toBe('hi');
  });

  it('ignores every other event without throwing', () => {
    for (const ev of [null, undefined, 42, 'x', {}, { type: 'session.created' }, { type: 5, transcript: 'x' }]) {
      expect(() => transcriptFromEvent(ev)).not.toThrow();
      expect(transcriptFromEvent(ev)).toBeNull();
    }
  });
});

describe('secondsRemaining', () => {
  const START = 1_000_000;

  it('counts down', () => {
    expect(secondsRemaining(START, START + 30_000, 180)).toBe(150);
  });

  it('floors at zero rather than going negative', () => {
    expect(secondsRemaining(START, START + 999_000, 180)).toBe(0);
  });

  it('never exceeds the ceiling when the clock jumps backwards', () => {
    expect(secondsRemaining(START, START - 60_000, 180)).toBe(180);
  });

  it('is the full ceiling at the instant it starts', () => {
    expect(secondsRemaining(START, START, 180)).toBe(180);
  });
});

describe('formatRemaining', () => {
  it.each([[180, '3:00'], [95, '1:35'], [9, '0:09'], [0, '0:00'], [-5, '0:00']])(
    'renders %i as %s', (input, expected) => {
      expect(formatRemaining(input)).toBe(expected);
    });
});

describe('browserSupported', () => {
  const ok = { RTCPeerConnection: function () {}, navigator: { mediaDevices: { getUserMedia: function () {} } } };

  it('accepts a browser with WebRTC and a microphone API', () => {
    expect(browserSupported(ok)).toBe(true);
  });

  it('refuses one without WebRTC', () => {
    expect(browserSupported({ ...ok, RTCPeerConnection: undefined })).toBe(false);
  });

  it('refuses one without getUserMedia — the http:// and old-Safari case', () => {
    expect(browserSupported({ ...ok, navigator: { mediaDevices: {} } })).toBe(false);
  });

  it('refuses one with no mediaDevices at all, without throwing', () => {
    expect(browserSupported({ ...ok, navigator: {} })).toBe(false);
    expect(browserSupported({ RTCPeerConnection: function () {} })).toBe(false);
  });
});
