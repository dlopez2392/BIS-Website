import { describe, it, expect, beforeEach } from 'vitest';
import { mountConcierge, type MountOptions } from '../mount';

const OPTS: MountOptions = {
  scriptUrl: 'https://app.bis-rgv.com/embed.js',
  publicId: 'b2swbbu52be8',
  locale: 'es',
  theme: 'dark',
  title: 'Chatea con nosotros',
};

type Guarded = Window & { __bisConciergeMounted?: boolean };

/** What the platform's loader does when it executes: append a panel and a
 *  launcher to <body> and set its once-per-page guard. */
function runLoader() {
  const panel = document.createElement('div');
  panel.dataset.fake = 'panel';
  const launcher = document.createElement('button');
  launcher.dataset.fake = 'launcher';
  document.body.appendChild(panel);
  document.body.appendChild(launcher);
  (window as Guarded).__bisConciergeMounted = true;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('mountConcierge', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete (window as Guarded).__bisConciergeMounted;
  });

  it('adds one async loader tag carrying the concierge, language, theme and launcher name', () => {
    mountConcierge(OPTS);
    const scripts = document.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    const s = scripts[0]!;
    expect(s.src).toBe('https://app.bis-rgv.com/embed.js');
    expect(s.async).toBe(true);
    expect({ ...s.dataset }).toEqual({
      concierge: 'b2swbbu52be8', locale: 'es', theme: 'dark', title: 'Chatea con nosotros',
    });
  });

  it('takes back everything the loader added, the tag, and the guard — so the next mount is not refused', async () => {
    const cleanup = mountConcierge(OPTS);
    const bystander = document.createElement('p');
    runLoader();
    await flush();
    document.querySelector('script')!.dispatchEvent(new Event('load'));
    // Appended after the loader finished: not the loader's, never removed.
    document.body.appendChild(bystander);
    await flush();

    cleanup();

    expect(document.querySelector('[data-fake]')).toBeNull();
    expect(document.querySelector('script')).toBeNull();
    expect((window as Guarded).__bisConciergeMounted).toBeUndefined();
    expect(document.body.contains(bystander)).toBe(true);
  });

  it('cleans up nodes the loader added in the same tick as the teardown', () => {
    const cleanup = mountConcierge(OPTS);
    runLoader();
    cleanup();
    expect(document.querySelector('[data-fake]')).toBeNull();
  });

  it('can mount again after cleanup, e.g. when the visitor switches language', () => {
    mountConcierge(OPTS)();
    mountConcierge({ ...OPTS, locale: 'en', theme: 'light' });
    const scripts = document.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.dataset.locale).toBe('en');
    expect(scripts[0]!.dataset.theme).toBe('light');
  });
});
