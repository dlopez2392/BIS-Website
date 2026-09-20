import type React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hero, pickVideoSource } from '../Hero';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...p }: { children?: React.ReactNode } & Record<string, unknown>) => <a {...p}>{children}</a>,
}));

const STATS = ['One point of contact', 'Fully bilingual, EN/ES', 'AI that ships to production'] as const;

const STAGE = {
  copy: {
    dashboard: { label: 'Dashboard', alt: 'The dashboard for a sample company' },
    calls: { label: 'Calls', alt: 'The call log' },
    pipeline: { label: 'Pipeline', alt: 'The opportunity board' },
    spanish: { label: 'A call in Spanish', alt: 'A call detail screen in Spanish' },
  },
  note: 'Sample account — invented company and data.',
  tabsLabel: 'Choose a screen',
} as const;

function renderHero() {
  return render(
    <Hero kicker="Kick" title="Let us Be your" titleAccent="Intelligent Solution."
      body="Body copy" cta="See how we do it" cta2="Book a free assessment" stats={STATS} stage={STAGE} />,
  );
}

describe('Hero', () => {
  it('renders the full headline as ONE accessible name across its two masked lines, both CTAs, and the three stats', () => {
    renderHero();
    // The two lines are separate blocks; without the explicit space between
    // them the name would read "Be yourIntelligent" and the e2e regex breaks.
    expect(screen.getByRole('heading', { level: 1, name: /Let us Be your Intelligent Solution\./i })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Book a free assessment' }).getAttribute('href')).toBe('/contact');
    expect(screen.getByRole('link', { name: 'See how we do it' }).getAttribute('href')).toBe('/services');
    for (const s of STATS) expect(screen.getByText(s)).toBeTruthy();
  });

  it('keeps the backdrop decorative and never fetches the video in a narrow or non-animating environment', () => {
    const { container } = renderHero();
    const photo = container.querySelector('.hero-photo');
    expect(photo?.getAttribute('aria-hidden')).toBe('true');
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    // jsdom's matchMedia mock reports no match, so the 9 MB file must not be requested.
    expect(video?.getAttribute('src')).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('shows exactly one product frame, names every screen, and keeps the sample-data caption in the DOM', () => {
    const { container } = renderHero();
    const shots = Array.from(container.querySelectorAll('.stage-screens img'));
    expect(shots).toHaveLength(4);
    // One `.is-on` and three not: the cross-fade is opacity-driven, so a
    // second lit frame would stack two screenshots rather than fail loudly.
    expect(shots.filter((el) => el.classList.contains('is-on'))).toHaveLength(1);
    // Every inactive frame is hidden from assistive tech, so the four alts do
    // not read as four screenshots in a row.
    expect(shots.filter((el) => el.getAttribute('aria-hidden') === 'true')).toHaveLength(3);
    for (const label of ['Dashboard', 'Calls', 'Pipeline', 'A call in Spanish']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
    expect(screen.getByText(STAGE.note)).toBeTruthy();
  });

  it('switches frames when a tab is picked, and marks it current', async () => {
    const user = userEvent.setup();
    const { container } = renderHero();
    await user.click(screen.getByRole('button', { name: 'Pipeline' }));
    const lit = container.querySelector('.stage-screens img.is-on');
    expect(lit?.getAttribute('alt')).toBe(STAGE.copy.pipeline.alt);
    expect(screen.getByRole('button', { name: 'Pipeline' }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('button', { name: 'Dashboard' }).getAttribute('aria-current')).toBeNull();
  });

  it('pins every entrance element visible when no animation runs (the no-blank-hero guarantee)', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 1; });
    try {
      const { container } = renderHero();
      await act(async () => {});
      const items = Array.from(container.querySelectorAll('.appear'));
      expect(items.length).toBeGreaterThan(5);
      expect(items.every((el) => el.classList.contains('is-in'))).toBe(true);
    } finally {
      raf.mockRestore();
    }
  });

  it('serves VP9 WebM only to browsers that can probably decode it, H.264 MP4 otherwise', () => {
    const says = (answer: (type: string) => CanPlayTypeResult) => ({ canPlayType: answer });
    expect(pickVideoSource(says((t) => (t.startsWith('video/webm') ? 'probably' : 'maybe')))).toBe('/hero/bis-hero.1.webm');
    expect(pickVideoSource(says((t) => (t.startsWith('video/mp4') ? 'probably' : '')))).toBe('/hero/bis-hero.1.mp4');
    expect(pickVideoSource(says(() => ''))).toBe('/hero/bis-hero.1.mp4');
  });
});
