import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveCall, type LiveCallStrings } from '../LiveCall';
import { SAMPLE_CALLS, MONDAY_AFTER, finishedLines } from '@/lib/home/calls';
import en from '../../../../messages/en.json';

const c = en.home.call;
const strings: LiveCallStrings = { ...c };

describe('LiveCall', () => {
  // jsdom has no IntersectionObserver and no matchMedia motion preference
  // that would start playback, which is exactly the server/no-motion case.
  it('renders the call finished: its last lines, the CRM record and Monday\'s moved count', () => {
    render(<LiveCall strings={strings} />);
    const lines = screen.getAllByRole('listitem');
    expect(lines.map((li) => li.textContent)).toEqual(
      finishedLines('es').map(([who, text]) => `${who === 'sofia' ? 'Sofía' : c.caller}${text}`),
    );
    expect(screen.getByText(c.ended)).toBeTruthy();
    expect(screen.getByText(String(MONDAY_AFTER))).toBeTruthy();
    expect(screen.getByText(c.mondayDelta)).toBeTruthy();
    expect(screen.getByText(c.crmBooked)).toBeTruthy();
  });

  it('marks the transcript with the language it was spoken in, whatever the page language', () => {
    render(<LiveCall strings={strings} />);
    expect(screen.getByRole('list').getAttribute('lang')).toBe('es');
  });
});

describe('the sample call', () => {
  it('is the same conversation in both languages', () => {
    const speakers = (l: 'es' | 'en') => SAMPLE_CALLS[l].map(([who]) => who);
    expect(speakers('en')).toEqual(speakers('es'));
  });
});
