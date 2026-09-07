'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { track } from '@vercel/analytics';
import { Mic, PhoneOff, Loader2, Volume2 } from 'lucide-react';
import {
  readTicketResponse, readMicError, transcriptFromEvent, secondsRemaining,
  formatRemaining, browserSupported, type SofiaFailure, type TranscriptLine,
} from '@/lib/sofia/session';

type Phase = 'idle' | 'connecting' | 'live' | 'ended';

/**
 * Lets a visitor hear Sofía without dialling.
 *
 * The audio path is browser ↔ OpenAI directly over WebRTC; this site never
 * carries the audio and never holds an OpenAI key. What it does is vouch for
 * the visitor (`/api/sofia/ticket`, behind the bot check and the rate limit)
 * and hand the browser a one-session credential minted by the platform.
 *
 * Three things this component refuses to do, all of them deliberate:
 * it never autoplays, it never opens the microphone before the visitor asks,
 * and it never claims the session did anything it did not — Sofía has no
 * tools here, which the panel says out loud rather than letting someone
 * believe they have been booked in.
 */
export function TalkToSofia() {
  const t = useTranslations('sofia');
  const [phase, setPhase] = useState<Phase>('idle');
  const [failure, setFailure] = useState<SofiaFailure | null>(null);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [left, setLeft] = useState<number | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  /** Idempotent: called by the visitor, by the countdown, and by unmount. */
  const stop = useCallback((reason: 'visitor' | 'timeup' | 'unmount') => {
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setLeft(null);
    if (reason !== 'unmount') setPhase('ended');
  }, []);

  // The microphone must not survive the component. A tab left open with a
  // live track is both a privacy problem and a bill.
  useEffect(() => () => stop('unmount'), [stop]);

  // Newest caption in view without yanking the whole page around.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  const start = useCallback(async () => {
    setFailure(null);
    setLines([]);

    if (!browserSupported(window)) {
      setFailure('unsupported');
      setPhase('ended');
      return;
    }

    setPhase('connecting');
    track('sofia_session_start');

    try {
      const ticketRes = await fetch('/api/sofia/ticket', { method: 'POST' });
      const ticketBody = await ticketRes.json().catch(() => null);
      const ticket = readTicketResponse(ticketRes.status, ticketBody);
      if (!ticket.ok) {
        setFailure(ticket.failure);
        setPhase('ended');
        return;
      }

      const sessionRes = await fetch(ticket.value.sessionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: ticket.value.ticket }),
      });
      if (!sessionRes.ok) {
        setFailure('unavailable');
        setPhase('ended');
        return;
      }
      const session = (await sessionRes.json()) as { value: string; maxSeconds: number };

      // Asked for only now — after we know there is a session to spend it on,
      // so nobody is prompted for their microphone and then told no.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        setFailure(readMicError(err));
        setPhase('ended');
        return;
      }
      streamRef.current = stream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.ontrack = (e) => {
        if (audioRef.current && e.streams[0]) audioRef.current.srcObject = e.streams[0];
      };
      const track0 = stream.getAudioTracks()[0];
      if (track0) pc.addTrack(track0, stream);

      const channel = pc.createDataChannel('oai-events');
      channel.onmessage = (e) => {
        let parsed: unknown;
        try { parsed = JSON.parse(e.data as string); } catch { return; }
        const line = transcriptFromEvent(parsed);
        if (line) setLines((prev) => [...prev, line]);
      };

      // A dropped connection is an ended call, not a frozen panel.
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setFailure('unavailable');
          stop('visitor');
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        body: offer.sdp,
        headers: { Authorization: `Bearer ${session.value}`, 'Content-Type': 'application/sdp' },
      });
      if (!sdpRes.ok) {
        setFailure('unavailable');
        stop('visitor');
        return;
      }
      await pc.setRemoteDescription({ type: 'answer', sdp: await sdpRes.text() });

      const startedAt = Date.now();
      const max = session.maxSeconds;
      setLeft(max);
      setPhase('live');

      const tick = window.setInterval(() => {
        const remaining = secondsRemaining(startedAt, Date.now(), max);
        setLeft(remaining);
        if (remaining <= 0) {
          window.clearInterval(tick);
          stop('timeup');
        }
      }, 1000);
      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'closed') window.clearInterval(tick);
      });
    } catch {
      setFailure('unavailable');
      setPhase('ended');
    }
  }, [stop]);

  const live = phase === 'live';
  const connecting = phase === 'connecting';

  return (
    <div className="rounded-2xl border border-hairline bg-surface-alt p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-ink">{t('title')}</h3>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">{t('blurb')}</p>
        </div>

        {live ? (
          <button
            type="button"
            onClick={() => { track('sofia_session_end'); stop('visitor'); }}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            <PhoneOff aria-hidden className="size-4" />
            {t('end')}
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={connecting}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {connecting
              ? <Loader2 aria-hidden className="size-4 animate-spin" />
              : <Mic aria-hidden className="size-4" />}
            {connecting ? t('connecting') : phase === 'ended' ? t('again') : t('start')}
          </button>
        )}
      </div>

      {/* Said before anyone starts, not after they have asked her to book. */}
      <p className="mt-4 text-xs text-ink-muted">{t('limits')}</p>

      {/* Politeness, not assertive: a caption arriving must not interrupt
          whatever a screen-reader user is already reading. */}
      <div aria-live="polite" className="sr-only">
        {failure ? t(`errors.${failure}`) : live ? t('liveAnnounce') : ''}
      </div>

      {failure && (
        <p data-testid="sofia-error" className="mt-4 rounded-xl border border-hairline bg-surface p-4 text-sm text-ink">
          {t(`errors.${failure}`)}
        </p>
      )}

      {(live || lines.length > 0) && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Volume2 aria-hidden className="size-3.5" />
              {t('transcript')}
            </span>
            {left !== null && (
              <span className="tabular-nums" aria-label={t('remaining', { time: formatRemaining(left) })}>
                {formatRemaining(left)}
              </span>
            )}
          </div>
          <div
            ref={logRef}
            className="mt-2 max-h-64 space-y-3 overflow-y-auto rounded-xl border border-hairline bg-surface p-4"
          >
            {lines.length === 0 ? (
              <p className="text-sm text-ink-muted">{t('listening')}</p>
            ) : (
              lines.map((line, i) => (
                <p key={i} className="text-sm text-ink">
                  <span className="font-semibold">
                    {line.role === 'sofia' ? t('speakerSofia') : t('speakerYou')}
                  </span>
                  {': '}
                  {line.text}
                </p>
              ))
            )}
          </div>
        </div>
      )}

      {/* Never autoplay: the element exists so the peer connection has
          somewhere to put her voice, and only plays once a track is attached
          by a session the visitor started themselves. */}
      <audio ref={audioRef} autoPlay className="hidden" />
    </div>
  );
}
