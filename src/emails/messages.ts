export const emailStrings = {
  en: {
    subject: 'We received your BIS assessment request',
    greeting: (name: string) => `Hi ${name},`,
    body: "Thanks for reaching out to Bespoke Intelligent Solutions. We received your free-assessment request and will be in touch within one business day. In the meantime, reply to this email with anything you'd like us to know.",
    signoff: '— Dan Lopez, Bespoke Intelligent Solutions',
  },
  es: {
    subject: 'Recibimos tu solicitud de evaluación de BIS',
    greeting: (name: string) => `Hola ${name}:`,
    body: 'Gracias por contactar a Bespoke Intelligent Solutions. Recibimos tu solicitud de evaluación gratuita y nos pondremos en contacto en un día hábil. Mientras tanto, responde a este correo con cualquier cosa que quieras que sepamos.',
    signoff: '— Dan Lopez, Bespoke Intelligent Solutions',
  },
} as const;

export type EmailLocale = keyof typeof emailStrings;

export function thankYouSubject(locale: EmailLocale): string {
  return emailStrings[locale].subject;
}
