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
});
