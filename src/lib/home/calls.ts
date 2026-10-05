/**
 * The sample call the home page plays: one after-hours call to Resaca Air
 * Conditioning, the demo company every capture on this site is taken from.
 * Spoken lines stay in the language they were spoken in — the Spanish call
 * is Spanish on the English page too, which is the point of showing it — so
 * they live here as data, not in the per-locale message catalogue.
 *
 * The call is invented, like the company; the caption under the player says
 * so. It is the same call hotspot 2 points at in the dashboard capture below.
 */
export type CallLang = 'es' | 'en';
export type Speaker = 'sofia' | 'caller';
export type CallLine = readonly [Speaker, string];

export const SAMPLE_CALLS: Record<CallLang, readonly CallLine[]> = {
  es: [
    ['sofia', 'Gracias por llamar a Resaca Air Conditioning, habla Sofía. ¿En qué le puedo ayudar?'],
    ['caller', 'Buenas noches. El aire no enfría desde el martes.'],
    ['sofia', '¿El aire prende y sopla, pero sale tibio, o no prende nada?'],
    ['caller', 'Prende, pero sale tibio.'],
    ['sofia', 'Tengo una cita el jueves de 10 a 12. ¿Se la aparto?'],
    ['caller', 'Sí, por favor.'],
    ['sofia', 'Listo, Verónica. Le mando la confirmación por mensaje.'],
  ],
  en: [
    ['sofia', 'Thanks for calling Resaca Air Conditioning, this is Sofía. How can I help?'],
    ['caller', 'Hi, good evening. The AC hasn’t cooled since Tuesday.'],
    ['sofia', 'Does it turn on and blow, but the air comes out warm? Or does nothing turn on?'],
    ['caller', 'It turns on, but it’s blowing warm.'],
    ['sofia', 'I have Thursday between 10 and 12. Shall I hold it for you?'],
    ['caller', 'Yes, please.'],
    ['sofia', 'Done, Verónica. I’m texting you the confirmation.'],
  ],
};

/** The CRM record the call leaves behind. */
export const SAMPLE_CONTACT = 'Verónica Alaniz';
/** The Monday email's count before and after this call lands in it. */
export const MONDAY_BEFORE = 18;
export const MONDAY_AFTER = 19;
/** What the call's timer reads when it ends. */
export const CALL_SECONDS = 112;
/** The transcript keeps the last few lines in view, as a phone screen would. */
export const VISIBLE_LINES = 5;

export function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** The lines the finished call shows: its last four, as the reduced-motion and server render. */
export function finishedLines(lang: CallLang): readonly CallLine[] {
  return SAMPLE_CALLS[lang].slice(-4);
}
