import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const OUT = path.join(process.cwd(), 'public', 'resources');
fs.mkdirSync(OUT, { recursive: true });

const VIOLET = '#7c3aed';
const INK = '#171528';
const MUTED = '#4a4763';

const docs = {
  'ai-readiness-checklist-en': {
    title: 'AI Readiness Checklist',
    subtitle: 'A 5-minute self-assessment for Rio Grande Valley businesses.',
    intro: 'Check the boxes that are already true for your business. The unchecked ones are where AI and automation can help you most. Your first project should be the easiest checkbox to fill.',
    sections: [
      ['Workflows', ['We know which tasks eat the most staff time each week', 'We have repeatable, rule-based work (intake, scheduling, follow-ups)', 'Our team re-types the same information into multiple systems', 'Customers wait on us for answers we could automate']],
      ['Data', ['Our key business data lives in systems we control', 'We can export our customer/job data if we needed to', 'Records are consistent enough to search and report on']],
      ['Tools', ['We use Microsoft 365 or Google Workspace', 'Our core tools can connect to each other (APIs/integrations)', 'We are open to a bilingual AI assistant for customers or staff']],
      ['Team', ['Someone owns "how we work" and could pilot a new tool', 'Staff are comfortable trying software that saves them time', 'We serve customers in both English and Spanish']],
      ['Security', ['We use multi-factor authentication on email and key apps', 'We have backups we have actually tested', 'We know who has access to what, and remove it when people leave']],
    ],
    cta: 'Most businesses can automate their first task in under two weeks. Book a free, no-pitch assessment at bis-rgv.com and we will show you the one that pays for itself first.',
  },
  'ai-readiness-checklist-es': {
    title: 'Lista de Preparación para IA',
    subtitle: 'Una autoevaluación de 5 minutos para negocios del Valle del Río Grande.',
    intro: 'Marca las casillas que ya son ciertas para tu negocio. Las que queden sin marcar son donde la IA y la automatización pueden ayudarte más. Tu primer proyecto debe ser la casilla más fácil de llenar.',
    sections: [
      ['Flujos de trabajo', ['Sabemos qué tareas consumen más tiempo del personal cada semana', 'Tenemos trabajo repetitivo y basado en reglas (admisión, agendas, seguimientos)', 'Nuestro equipo vuelve a escribir la misma información en varios sistemas', 'Los clientes esperan por respuestas que podríamos automatizar']],
      ['Datos', ['Nuestros datos clave están en sistemas que controlamos', 'Podríamos exportar los datos de clientes/trabajos si lo necesitáramos', 'Los registros son suficientemente consistentes para buscar y reportar']],
      ['Herramientas', ['Usamos Microsoft 365 o Google Workspace', 'Nuestras herramientas principales se pueden conectar (APIs/integraciones)', 'Estamos abiertos a un asistente de IA bilingüe para clientes o personal']],
      ['Equipo', ['Alguien es responsable de "cómo trabajamos" y podría probar una herramienta nueva', 'El personal está cómodo probando software que le ahorre tiempo', 'Atendemos a clientes en inglés y español']],
      ['Seguridad', ['Usamos autenticación de múltiples factores en el correo y apps clave', 'Tenemos respaldos que de verdad hemos probado', 'Sabemos quién tiene acceso a qué, y lo quitamos cuando alguien se va']],
    ],
    cta: 'La mayoría de los negocios puede automatizar su primera tarea en menos de dos semanas. Reserva una evaluación gratuita y sin presión de venta en bis-rgv.com y te mostraremos la que se paga sola primero.',
  },
  'cybersecurity-guide-en': {
    title: 'Small-Business Cybersecurity Guide',
    subtitle: 'A practical security checklist for Rio Grande Valley businesses.',
    intro: 'Check the boxes that are already true. The unchecked ones are your biggest, cheapest security wins. You do not need an enterprise budget — you need the basics done consistently.',
    sections: [
      ['Accounts & access', ['Multi-factor authentication (MFA) is on for email and every critical app', 'Staff use unique passwords via a password manager, not sticky notes', 'Admin accounts are separate from everyday accounts', 'We remove access the same day someone leaves']],
      ['Email & phishing', ['Staff know how to spot and report a phishing email', 'We verify money or gift-card requests by phone, never by email alone', 'Our domain has basic email protections (SPF, DKIM, DMARC)']],
      ['Devices', ['Every computer and phone locks with a PIN or password and auto-locks', 'Devices install security updates automatically', 'Business devices run reputable endpoint protection']],
      ['Data & backups', ['We back up critical data automatically', 'We have actually restored from a backup to confirm it works', 'Sensitive files are shared with links and permissions, not forwarded copies']],
      ['If something goes wrong', ['We know who to call and what to do first if we suspect a breach', 'We have cyber-insurance or have priced it out', 'Someone owns security and reviews it a few times a year']],
    ],
    cta: 'Not sure where you stand? Book a free, no-pitch security assessment at bis-rgv.com and we will show you the one fix that closes your biggest gap first.',
  },
  'cybersecurity-guide-es': {
    title: 'Guía de Ciberseguridad para Pequeños Negocios',
    subtitle: 'Una lista práctica de seguridad para negocios del Valle del Río Grande.',
    intro: 'Marca las casillas que ya son ciertas. Las que queden sin marcar son tus mejoras de seguridad más grandes y económicas. No necesitas un presupuesto de empresa grande — necesitas hacer lo básico de forma constante.',
    sections: [
      ['Cuentas y acceso', ['La autenticación de múltiples factores (MFA) está activada en el correo y en cada app crítica', 'El personal usa contraseñas únicas con un gestor de contraseñas, no notas pegadas', 'Las cuentas de administrador están separadas de las de uso diario', 'Quitamos el acceso el mismo día que alguien se va']],
      ['Correo y phishing', ['El personal sabe identificar y reportar un correo de phishing', 'Verificamos por teléfono cualquier solicitud de dinero o tarjetas de regalo, nunca solo por correo', 'Nuestro dominio tiene protecciones básicas de correo (SPF, DKIM, DMARC)']],
      ['Dispositivos', ['Cada computadora y teléfono se bloquea con PIN o contraseña y se bloquea solo', 'Los dispositivos instalan actualizaciones de seguridad automáticamente', 'Los dispositivos del negocio usan protección de endpoints confiable']],
      ['Datos y respaldos', ['Respaldamos los datos críticos automáticamente', 'De verdad hemos restaurado desde un respaldo para confirmar que funciona', 'Los archivos sensibles se comparten con enlaces y permisos, no con copias reenviadas']],
      ['Si algo sale mal', ['Sabemos a quién llamar y qué hacer primero si sospechamos una brecha', 'Tenemos ciberseguro o ya lo cotizamos', 'Alguien es responsable de la seguridad y la revisa varias veces al año']],
    ],
    cta: 'No sabes en qué punto estás? Reserva una evaluación de seguridad gratuita y sin presión de venta en bis-rgv.com y te mostraremos la solución que cierra tu brecha más grande primero.',
  },
};

for (const [name, d] of Object.entries(docs)) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 56 });
  doc.pipe(fs.createWriteStream(path.join(OUT, `${name}.pdf`)));

  doc.fillColor(VIOLET).fontSize(11).font('Helvetica-Bold').text('bis>');
  doc.moveDown(0.5);
  doc.fillColor(INK).fontSize(24).font('Helvetica-Bold').text(d.title);
  doc.fillColor(MUTED).fontSize(12).font('Helvetica').text(d.subtitle);
  doc.moveDown(0.8);
  doc.fillColor(INK).fontSize(11).font('Helvetica').text(d.intro);
  doc.moveDown(0.8);

  for (const [heading, items] of d.sections) {
    doc.fillColor(VIOLET).fontSize(13).font('Helvetica-Bold').text(heading);
    doc.moveDown(0.2);
    doc.fillColor(INK).fontSize(11).font('Helvetica');
    for (const item of items) doc.text(`[ ]  ${item}`, { indent: 8 });
    doc.moveDown(0.6);
  }

  doc.moveDown(0.4);
  doc.fillColor(MUTED).fontSize(11).font('Helvetica-Oblique').text(d.cta);
  doc.end();
}

console.log('Resource PDFs written to public/resources/');
