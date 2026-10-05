import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../../../messages/en.json';

vi.mock('@vercel/analytics', () => ({ track: () => {} }));

import { TalkToSofia } from '../TalkToSofia';

/**
 * The microphone and the paid session must not outlive the panel. `stop`
 * closes what is in the refs; these pin the case it cannot see — an unmount
 * while `start` is still waiting — which closing the Ask BIS panel mid-connect
 * reaches.
 */
describe('TalkToSofia unmounted while connecting', () => {
  let resolveMic: (s: MediaStream) => void;
  const trackStop = vi.fn();
  const peers: unknown[] = [];

  beforeEach(() => {
    trackStop.mockReset();
    peers.length = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === '/api/sofia/ticket') {
        return new Response(JSON.stringify({ ticket: 't', sessionUrl: 'https://app.bis-rgv.com/s' }), { status: 200 });
      }
      return new Response(JSON.stringify({ value: 'k', maxSeconds: 180 }), { status: 200 });
    }));
    vi.stubGlobal('RTCPeerConnection', class { constructor() { peers.push(this); } });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => new Promise<MediaStream>((res) => { resolveMic = res; }) },
    });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('stops the microphone it is handed after unmount, and never opens a connection', async () => {
    const { unmount } = render(
      <NextIntlClientProvider locale="en" messages={{ sofia: en.sofia }}>
        <TalkToSofia placement="ask" bare />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start talking' }));
    // Let the two fetches settle so start() is parked on the mic prompt.
    await act(async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); });
    unmount();
    const stream = { getTracks: () => [{ stop: trackStop }], getAudioTracks: () => [{ stop: trackStop }] };
    await act(async () => { resolveMic(stream as unknown as MediaStream); await Promise.resolve(); await Promise.resolve(); });
    expect(trackStop).toHaveBeenCalled();
    expect(peers).toHaveLength(0);
  });
});
