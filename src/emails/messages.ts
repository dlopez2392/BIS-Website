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

/**
 * The security-check report. Finding titles and explanations are NOT repeated
 * here: they live in the site's message catalogue, which the server reads and
 * passes in, so the email and the page can never say different things about
 * the same finding.
 */
export const scanReportStrings = {
  en: {
    subject: (domain: string, grade: string) => `Your security check for ${domain} — grade ${grade}`,
    greeting: (name: string) => (name ? `Hi ${name},` : 'Hi,'),
    intro: (domain: string) =>
      `Here is the full result for ${domain}. It reads public DNS records and the response headers the site already sends to every visitor — nothing was logged into, no ports were scanned, and no password was tested.`,
    scoreLine: (grade: string, points: number) => `Overall grade: ${grade} (${points} out of 100)`,
    fixFirst: 'Worth fixing first',
    everything: 'Everything checked',
    statusPass: 'Good',
    statusWarn: 'Could be better',
    statusFail: 'Needs attention',
    statusUnknown: 'Not applicable',
    outro:
      'This only covers what is visible from outside. Most of what puts a business at risk is not: shared passwords, no tested backups, one person holding every key. A free 30-minute assessment covers the rest.',
    cta: 'Book a free assessment',
    signoff: '— Dan Lopez, Bespoke Intelligent Solutions',
  },
  es: {
    subject: (domain: string, grade: string) => `Tu revisión de seguridad de ${domain} — calificación ${grade}`,
    greeting: (name: string) => (name ? `Hola ${name}:` : 'Hola:'),
    intro: (domain: string) =>
      `Este es el resultado completo de ${domain}. Lee registros DNS públicos y los encabezados que el sitio ya envía a cada visitante: no se entró a ninguna cuenta, no se escanearon puertos y no se probó ninguna contraseña.`,
    scoreLine: (grade: string, points: number) => `Calificación general: ${grade} (${points} de 100)`,
    fixFirst: 'Conviene arreglar primero',
    everything: 'Todo lo revisado',
    statusPass: 'Bien',
    statusWarn: 'Se puede mejorar',
    statusFail: 'Necesita atención',
    statusUnknown: 'No aplica',
    outro:
      'Esto solo cubre lo que se ve desde afuera. Casi todo lo que pone en riesgo a un negocio no se ve: contraseñas compartidas, respaldos sin probar, una sola persona con todas las llaves. Una evaluación gratuita de 30 minutos cubre el resto.',
    cta: 'Agenda una evaluación gratuita',
    signoff: '— Dan Lopez, Bespoke Intelligent Solutions',
  },
} as const;
