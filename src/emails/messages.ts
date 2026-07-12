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

export function resourceSubject(locale: EmailLocale): string {
  return resourceEmailStrings[locale].subject;
}
