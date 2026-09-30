/**
 * Mounts the BIS Platform's website assistant on this page, and can take it
 * back off.
 *
 * The platform's contract is one script tag: `embed.js` with
 * `data-concierge="<publicId>"`. The loader builds a fixed launcher and a
 * panel holding the chat iframe, appends both to <body>, and sets
 * `window.__bisConciergeMounted` so a snippet pasted twice mounts once. That
 * contract assumes a page loads once. This site does not: the language switch
 * and the theme toggle re-render in place, and both change what the chat
 * should be (`data-locale`, `data-theme`). So this wrapper records exactly
 * which nodes the loader added, and the cleanup removes them, the script,
 * and the guard, so the next mount starts clean.
 *
 * What cleanup cannot undo: the loader's own window listeners (message,
 * keydown, a media query). Each is bound to the removed iframe and panel, so
 * after teardown they act on detached nodes and match nothing. A language
 * switch leaks three inert closures; that is the accepted cost of not asking
 * the platform for an unmount API it would only need for this one host.
 */
export interface MountOptions {
  scriptUrl: string;
  publicId: string;
  locale: string;
  theme: 'light' | 'dark';
  /** The launcher's accessible name. */
  title: string;
}

type Guarded = Window & { __bisConciergeMounted?: boolean };

export function mountConcierge(opts: MountOptions, doc: Document = document): () => void {
  const win = doc.defaultView as Guarded | null;
  const target = doc.body ?? doc.documentElement;
  const added: Node[] = [];

  // Whatever the loader appends while it runs is ours to remove later. It
  // appends synchronously on execution, so observing until `load` fires
  // catches the panel and the launcher and nothing that came after.
  const observer = new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach((n) => { if (n !== script) added.push(n); });
  });
  observer.observe(target, { childList: true });

  const script = doc.createElement('script');
  script.src = opts.scriptUrl;
  script.async = true;
  script.dataset.concierge = opts.publicId;
  script.dataset.locale = opts.locale;
  script.dataset.theme = opts.theme;
  script.dataset.title = opts.title;
  const stop = () => observer.disconnect();
  script.addEventListener('load', stop, { once: true });
  script.addEventListener('error', stop, { once: true });
  target.appendChild(script);

  return () => {
    // Drain BEFORE disconnecting: disconnect() discards queued records, so a
    // teardown in the same tick as the loader ran would otherwise leave its
    // panel and launcher on the page.
    for (const r of observer.takeRecords()) r.addedNodes.forEach((n) => { if (n !== script) added.push(n); });
    observer.disconnect();
    for (const n of added) n.parentNode?.removeChild(n);
    script.remove();
    if (win) delete win.__bisConciergeMounted;
  };
}
