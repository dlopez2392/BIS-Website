import type { UIMessage } from 'ai';

/**
 * Keeping a conversation across a page load.
 *
 * The widget lives in the layout, so client-side navigation already preserves
 * it. A reload did not, which is the case that actually loses people: a
 * visitor asks a question, opens the pricing page in the same tab from a link
 * the assistant gave them, comes back, and finds an empty box.
 *
 * sessionStorage rather than localStorage on purpose. The conversation belongs
 * to this visit; a message typed a fortnight ago reappearing on a shared
 * machine is a small privacy problem BIS should not create for itself. Every
 * access is guarded because storage throws outright in some privacy modes, and
 * a chat widget must never be the reason a page fails to render.
 */

const KEY = 'bis:chat';
/** Matches the server's own cap, so a restored conversation cannot arrive over the limit. */
export const MAX_STORED = 18;

export function loadMessages(): UIMessage[] {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Anything that does not look like a message is dropped rather than fed to
    // the SDK: this value is user-writable, and the shape can change between
    // deploys while a tab stays open.
    return parsed
      .filter((m): m is UIMessage =>
        !!m && typeof m === 'object'
        && typeof (m as UIMessage).id === 'string'
        && ((m as UIMessage).role === 'user' || (m as UIMessage).role === 'assistant')
        && Array.isArray((m as UIMessage).parts))
      .slice(-MAX_STORED);
  } catch {
    return [];
  }
}

export function saveMessages(messages: UIMessage[]): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-MAX_STORED)));
  } catch {
    /* private mode, quota, or storage disabled — the chat still works */
  }
}

export function clearMessages(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
