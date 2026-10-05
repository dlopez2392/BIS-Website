import { Link } from '@/i18n/navigation';

type Size = 'display' | 'h2' | 'h3';

/**
 * A headline's twin in the other language, set under it in the italic serif.
 *
 * Twins are the bilingual claim made visible: every section says its line in
 * both of the Valley's languages, so a Spanish-first reader on the English
 * page sees their language before they find the switch. A section twin is a
 * LINK to the same section of the other locale's page — one tap and the page
 * is in that language. Row twins (`as="text"`) are only text; three more links
 * in a row of services would be noise.
 *
 * Outside the heading on purpose: inside it, the heading's accessible name
 * would be read in two languages with one voice. Here it is its own element
 * with its own `lang`, so a screen reader switches voice for it.
 */
export function Twin({ text, locale, size, hash, as = 'link' }: {
  text: string; locale: string; size: Size; hash?: string; as?: 'link' | 'text';
}) {
  const other = locale === 'en' ? 'es' : 'en';
  const cls = `hm-twin hm-twin--${size}`;
  if (as === 'text') return <p lang={other} className={cls}>{text}</p>;
  return (
    <p>
      <Link href={{ pathname: '/', hash }} locale={other} lang={other} hrefLang={other} className={cls} data-twin>
        {text}
      </Link>
    </p>
  );
}
