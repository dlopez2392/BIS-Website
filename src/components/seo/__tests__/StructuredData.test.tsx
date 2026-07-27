import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StructuredData } from '../StructuredData';

describe('StructuredData', () => {
  it('emits a valid ProfessionalService JSON-LD block', () => {
    const { container } = render(<StructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('ProfessionalService');
    expect(data.name).toBe('Bespoke Intelligent Solutions');
    expect(data.address.addressLocality).toBe('Harlingen');
    expect(data.areaServed).toContain('Rio Grande Valley');
    expect(data.availableLanguage).toEqual(['English', 'Spanish']);
    expect(data.founder.name).toBe('Dan Lopez');
  });

  it('publishes the real phone number, never the launch placeholder', () => {
    // The placeholder +1-956-000-0000 shipped in this JSON-LD for weeks. A bad
    // number in structured data is worse than none, so pin it.
    const { container } = render(<StructuredData />);
    const data = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(data.telephone).toBe('+1-956-705-5146');
    expect(data.telephone).not.toContain('000-0000');
  });
});
