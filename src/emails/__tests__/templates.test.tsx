import { describe, it, expect } from 'vitest';
import { render } from '@react-email/render';
import { ThankYou } from '../ThankYou';
import { LeadNotification } from '../LeadNotification';

describe('email templates', () => {
  it('renders the EN thank-you with an English greeting and body', async () => {
    const html = await render(<ThankYou locale="en" fullName="Ana Reyes" />);
    expect(html).toContain('Hi Ana Reyes');
    expect(html).toContain('Thanks for reaching out');
  });

  it('renders the ES thank-you with Spanish copy', async () => {
    const html = await render(<ThankYou locale="es" fullName="Ana Reyes" />);
    expect(html).toContain('Hola Ana Reyes');
    expect(html).toContain('Gracias por contactar');
  });

  it('renders the internal notification with the lead details', async () => {
    const html = await render(
      <LeadNotification lead={{
        fullName: 'Ana Reyes', businessName: 'Reyes Law', email: 'ana@reyeslaw.com',
        phone: '956-555-0100', industry: 'legal', language: 'es', message: 'Necesito ayuda',
      }} />
    );
    expect(html).toContain('Ana Reyes');
    expect(html).toContain('ana@reyeslaw.com');
    expect(html).toContain('legal');
    expect(html).toContain('Necesito ayuda');
  });
});
