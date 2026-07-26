import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { linkify } from '../linkify';

const renderText = (text: string) => render(<p>{linkify(text)}</p>);

describe('linkify', () => {
  it('leaves plain text untouched', () => {
    const { container } = renderText('We serve the Rio Grande Valley.');
    expect(container.querySelectorAll('a').length).toBe(0);
    expect(container.textContent).toBe('We serve the Rio Grande Valley.');
  });

  it('turns a bare URL into an anchor that opens in a new tab', () => {
    const { container } = renderText('See https://bis-rgv.com/en/faq for more.');
    const anchors = container.querySelectorAll('a');
    expect(anchors.length).toBe(1);
    expect(anchors[0].getAttribute('href')).toBe('https://bis-rgv.com/en/faq');
    expect(anchors[0].getAttribute('target')).toBe('_blank');
    expect(anchors[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(container.textContent).toBe('See https://bis-rgv.com/en/faq for more.');
  });

  it('links every URL when several appear, including back to back', () => {
    const { container } = renderText('https://bis-rgv.com/es/faq y https://bis-rgv.com/es/capabilities ahora');
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['https://bis-rgv.com/es/faq', 'https://bis-rgv.com/es/capabilities']);
  });

  it('does not swallow trailing sentence punctuation into the href', () => {
    const { container } = renderText('Read https://bis-rgv.com/en/insights.');
    expect(container.querySelector('a')?.getAttribute('href')).toBe('https://bis-rgv.com/en/insights');
    expect(container.textContent).toBe('Read https://bis-rgv.com/en/insights.');
  });

  it('handles an empty string', () => {
    const { container } = renderText('');
    expect(container.textContent).toBe('');
  });
});
