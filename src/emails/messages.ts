export const resourceEmailStrings = {
  en: {
    subject: 'Your free checklist from BIS',
    greeting: (name: string) => (name ? `Hi ${name},` : 'Hi,'),
    body: 'Thanks for grabbing the AI Readiness Checklist. Your download link is below — it is yours to keep and share. When you are ready to act on it, a free, no-pitch assessment is one click away.',
    link: 'Download your checklist',
    signoff: '— Dan Lopez, Bespoke Intelligent Solutions',
  },
  es: {
    subject: 'Tu lista gratuita de BIS',
    greeting: (name: string) => (name ? `Hola ${name}:` : 'Hola:'),
    body: 'Gracias por descargar la Lista de Preparación para IA. Tu enlace de descarga está abajo — es tuyo para conservar y compartir. Cuando quieras actuar, una evaluación gratuita y sin presión de venta está a un clic.',
    link: 'Descarga tu lista',
    signoff: '— Dan Lopez, Bespoke Intelligent Solutions',
  },
} as const;

export type EmailLocale = keyof typeof resourceEmailStrings;

export function resourceSubject(locale: EmailLocale): string {
  return resourceEmailStrings[locale].subject;
}
