import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { PlatformEmbed } from '../PlatformEmbed';
import { PLATFORM_ORIGIN, FORM_PUBLIC_IDS, BOOKING_PUBLIC_ID } from '@/lib/platform';

let mockLocale = 'en';
let mockResolvedTheme: string | undefined = 'light';
const track = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale,
}));
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: mockResolvedTheme }) }));
vi.mock('@vercel/analytics', () => ({ track: (...args: unknown[]) => track(...args) }));

function frame(): HTMLIFrameElement {
  return screen.getByTitle('formTitle') as HTMLIFrameElement;
}

function post(iframe: HTMLIFrameElement, data: unknown, origin = PLATFORM_ORIGIN, source: unknown = iframe.contentWindow) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, origin, source: source as Window }));
  });
}

beforeEach(() => {
  mockLocale = 'en';
  mockResolvedTheme = 'light';
  track.mockReset();
  document.documentElement.classList.remove('dark');
});

afterEach(() => cleanup());

describe('PlatformEmbed', () => {
  it('frames the locale-specific form on the platform with locale and theme hints', () => {
    mockLocale = 'es';
    mockResolvedTheme = 'dark';
    render(<PlatformEmbed kind="form" />);
    const url = new URL(frame().src);
    expect(url.origin).toBe(PLATFORM_ORIGIN);
    expect(url.pathname).toBe(`/f/${FORM_PUBLIC_IDS.es}`);
    expect(url.searchParams.get('locale')).toBe('es');
    expect(url.searchParams.get('theme')).toBe('dark');
    expect(url.searchParams.get('page')).toBe(window.location.href);
  });

  it('frames the booking calendar and links to the bare page as a fallback', () => {
    render(<PlatformEmbed kind="booking" />);
    const iframe = screen.getByTitle('bookTitle') as HTMLIFrameElement;
    expect(new URL(iframe.src).pathname).toBe(`/b/${BOOKING_PUBLIC_ID}`);
    const link = screen.getByRole('link', { name: /bookFallback/ });
    expect(link.getAttribute('href')).toBe(`${PLATFORM_ORIGIN}/b/${BOOKING_PUBLIC_ID}?locale=en`);
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('reads the dark class off <html> before next-themes has resolved, so dark visitors never see a light flash', () => {
    mockResolvedTheme = undefined;
    document.documentElement.classList.add('dark');
    render(<PlatformEmbed kind="form" />);
    expect(new URL(frame().src).searchParams.get('theme')).toBe('dark');
  });

  it('resizes to the height its own iframe reports', () => {
    render(<PlatformEmbed kind="form" />);
    post(frame(), { type: 'bis-form-height', height: 812.4 });
    expect(frame().style.height).toBe('813px');
  });

  it('ignores a height message from the wrong origin or the wrong window', () => {
    render(<PlatformEmbed kind="form" />);
    const before = frame().style.height;
    post(frame(), { type: 'bis-form-height', height: 4000 }, 'https://evil.example');
    expect(frame().style.height).toBe(before);
    post(frame(), { type: 'bis-form-height', height: 4000 }, PLATFORM_ORIGIN, window);
    expect(frame().style.height).toBe(before);
  });

  it('counts a submitted form as a lead, and a booking as a booking', () => {
    render(<PlatformEmbed kind="form" />);
    post(frame(), { type: 'bis-form-submitted' });
    expect(track).toHaveBeenCalledWith('lead_submitted', { locale: 'en', source: 'bis-platform' });
    post(frame(), { type: 'bis-booking-submitted' });
    expect(track).toHaveBeenCalledWith('assessment_booked', { locale: 'en', source: 'bis-platform' });
  });

  it('does not count a submitted message from anywhere but its own iframe', () => {
    render(<PlatformEmbed kind="form" />);
    post(frame(), { type: 'bis-form-submitted' }, 'https://evil.example');
    expect(track).not.toHaveBeenCalled();
  });
});
