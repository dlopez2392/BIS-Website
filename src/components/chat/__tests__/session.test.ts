import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { loadMessages, saveMessages, clearMessages, MAX_STORED } from '../session';
import type { UIMessage } from 'ai';

const message = (id: string, role: 'user' | 'assistant' = 'user'): UIMessage =>
  ({ id, role, parts: [{ type: 'text', text: `m${id}` }] }) as UIMessage;

beforeEach(() => window.sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('chat session storage', () => {
  it('round-trips a conversation', () => {
    saveMessages([message('1'), message('2', 'assistant')]);
    expect(loadMessages().map((m) => m.id)).toEqual(['1', '2']);
  });

  it('returns nothing when there is nothing stored', () => {
    expect(loadMessages()).toEqual([]);
  });

  it('never restores more than the server will accept', () => {
    saveMessages(Array.from({ length: 40 }, (_, i) => message(String(i))));
    expect(loadMessages()).toHaveLength(MAX_STORED);
    // Keeps the most recent, which is the part of the conversation in play.
    expect(loadMessages()[MAX_STORED - 1].id).toBe('39');
  });

  it('drops anything that does not look like a message', () => {
    // The value is user-writable and its shape can change between deploys
    // while a tab stays open, so it is filtered rather than trusted.
    window.sessionStorage.setItem('bis:chat', JSON.stringify([
      message('good'),
      { id: 'no-parts', role: 'user' },
      { role: 'user', parts: [] },
      { id: 'bad-role', role: 'system', parts: [] },
      'not an object',
      null,
    ]));
    expect(loadMessages().map((m) => m.id)).toEqual(['good']);
  });

  it('survives corrupt JSON rather than breaking the page', () => {
    window.sessionStorage.setItem('bis:chat', '{oops');
    expect(loadMessages()).toEqual([]);
  });

  it('survives storage being unavailable, in both directions', () => {
    const boom = () => { throw new Error('storage disabled'); };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(boom);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(boom);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(boom);
    expect(loadMessages()).toEqual([]);
    expect(() => saveMessages([message('1')])).not.toThrow();
    expect(() => clearMessages()).not.toThrow();
  });

  it('uses sessionStorage, so a conversation does not outlive the visit', () => {
    saveMessages([message('1')]);
    expect(window.sessionStorage.getItem('bis:chat')).toBeTruthy();
    expect(window.localStorage.getItem('bis:chat')).toBeNull();
  });
});
