/**
 * The message namespaces that must travel to the BROWSER.
 *
 * `NextIntlClientProvider` with no `messages` prop serializes the ENTIRE
 * catalogue into the RSC payload of every page. That was ~77KB of JSON on
 * every single page view — measured at 75-81% of the HTML on /en, /en/work
 * and /en/contact — and it meant a visitor reading the contact page also
 * downloaded the legal industry page, the Harlingen city page, the platform
 * tour and the whole insights section. Handing the provider only these
 * namespaces takes that to ~18KB.
 *
 * THE RULE THAT DECIDES THIS LIST, and it is mechanical rather than a
 * judgement call:
 *
 *   `useTranslations()` is the ISOMORPHIC hook — it reads from the provider,
 *   so it can run in the browser, so its namespace must be here.
 *
 *   `getTranslations()` is the server-only async API. It resolves during the
 *   render and nothing has to reach the browser, which is why the 23 page
 *   files that use it contribute nothing to this list.
 *
 * So: a namespace belongs here if and only if some component reads it with
 * `useTranslations`. `client-namespaces.test.ts` enforces exactly that, which
 * is the point — a missing namespace does not fail the build, it throws in a
 * real visitor's browser on a live marketing page. The test turns that into a
 * red run instead.
 *
 * Deliberately whole top-level namespaces, never leaf keys: `resources.form`
 * is read by ResourceForm, and shipping `resources` entire costs little while
 * keeping this list something a person can reason about.
 */
export const CLIENT_NAMESPACES = [
  'chat',           // ChatWidget
  'contact',        // PlatformEmbed
  'firstHourBack',  // FirstHourBack
  'footer',         // Footer
  'meta',           // not-found
  'nav',            // Header, MobileNav, CallLink
  'resources',      // ResourceForm (resources.form)
  'securityCheck',  // SecurityCheckForm
  'sofia',          // TalkToSofia
  'whatsapp',       // WhatsAppLink
] as const;

/** The subset of `messages` the client is allowed to see. */
export function clientMessages(
  messages: Record<string, unknown>,
): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const ns of CLIENT_NAMESPACES) {
    if (ns in messages) picked[ns] = messages[ns];
  }
  return picked;
}
