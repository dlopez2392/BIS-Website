import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The site's Spanish speaks *usted*, as the platform does (owner decision,
 * 2026-11-01: "usted everywhere, customer-facing included"). A prospect who
 * reads this site and then books lands on the platform's booking page and
 * emails, so one brand must not switch register between the two.
 *
 * This catches the common *tú* words, whole words only. It cannot prove a
 * sentence is in *usted*, but every one of these words was in the copy before
 * the conversion, which makes them the words a new string is likely to bring
 * back.
 */
const TU_WORDS = [
  'tú', 'tu', 'tus', 'ti', 'te', 'contigo',
  'puedes', 'tienes', 'quieres', 'sabes', 'necesitas', 'eres', 'estás', 'haces', 'vas',
  'llámanos', 'escríbenos', 'cuéntanos', 'pregúntale', 'pruébalo',
];
// Case-sensitive past the first letter, so "TI" (tecnologías de la
// información) is not read as the pronoun "ti".
const TU = new RegExp(
  `(?<!\\p{L})(${TU_WORDS.map((w) => `[${w[0].toUpperCase()}${w[0]}]${w.slice(1)}`).join('|')})(?!\\p{L})`,
  'u',
);

/** Words a CUSTOMER says or a person's own question, quoted as written. Keyed by where they are. */
const ALLOWED: Record<string, RegExp> = {};

function strings(value: unknown, at: string, out: [string, string][]) {
  if (typeof value === 'string') out.push([at, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${at}.${i}`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) strings(v, at ? `${at}.${k}` : k, out);
  }
  return out;
}

function offenders(entries: [string, string][]) {
  return entries
    .filter(([where, text]) => TU.test(text) && !ALLOWED[where]?.test(text))
    .map(([where, text]) => `${where}: ${text.match(TU)![0]} — ${text.slice(0, 80)}`);
}

describe('Spanish register', () => {
  it('messages/es.json addresses the reader as usted', () => {
    const es = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', 'es.json'), 'utf8'));
    expect(offenders(strings(es, '', []))).toEqual([]);
  });

  it('the Spanish articles address the reader as usted', () => {
    const dir = path.join(process.cwd(), 'src', 'content', 'insights', 'es');
    const entries: [string, string][] = [];
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
      fs.readFileSync(path.join(dir, file), 'utf8').split('\n').forEach((line, i) => {
        // Link targets are paths, not words.
        entries.push([`${file}:${i + 1}`, line.replace(/\]\([^)]*\)/g, ']')]);
      });
    }
    expect(offenders(entries)).toEqual([]);
  });

  it('catches the words it is meant to catch', () => {
    for (const s of ['Llámanos hoy', 'tu negocio', '¿Tienes preguntas?', 'Agenda tu cita']) {
      expect(TU.test(s), s).toBe(true);
    }
    for (const s of ['Llámenos hoy', 'su negocio', 'Sofía contesta', 'una agenda llena', 'Hable con Sofía', 'su proveedor de TI']) {
      expect(TU.test(s), s).toBe(false);
    }
  });
});
