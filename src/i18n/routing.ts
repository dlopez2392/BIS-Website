import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  // next-intl's NEXT_LOCALE cookie ships without `Secure` by default, which
  // this site's own security checker correctly flagged: a cookie that may be
  // sent over plain HTTP is a cookie an attacker on shared Wi-Fi can read or
  // set. It stays readable to scripts (no HttpOnly) because the language
  // switcher is client-side, and it holds nothing but 'en' or 'es'.
  localeCookie: { secure: true, sameSite: 'lax' },
});
