import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StructuredData } from '../StructuredData';
import { JsonLd } from '../JsonLd';

const renderSchema = (ui: React.ReactElement) => {
  const { container } = render(ui);
  const script = container.querySelector('script[type="application/ld+json"]');
  expect(script).toBeTruthy();
  return { script: script!, data: JSON.parse(script!.textContent!.replace(/\\u003c/g, '<')) };
};

describe('StructuredData', () => {
  it('emits a valid ProfessionalService JSON-LD block', () => {
    const { data } = renderSchema(<StructuredData locale="en" description="What we do." />);
    expect(data['@type']).toBe('ProfessionalService');
    expect(data.name).toBe('Bespoke Intelligent Solutions');
    expect(data.address.addressLocality).toBe('Harlingen');
    expect(data.areaServed).toContainEqual({ '@type': 'Place', name: 'Rio Grande Valley' });
    expect(data.availableLanguage).toEqual(['English', 'Spanish']);
    expect(data.founder.name).toBe('Dan Lopez');
  });

  it('publishes the real phone number, never the launch placeholder', () => {
    // The placeholder +1-956-000-0000 shipped in this JSON-LD for weeks. A bad
    // number in structured data is worse than none, so pin it.
    const { data } = renderSchema(<StructuredData locale="en" description="What we do." />);
    expect(data.telephone).toBe('+1-956-705-5146');
    expect(data.telephone).not.toContain('000-0000');
  });

  it('passes the translated description straight through', () => {
    const { data } = renderSchema(<StructuredData locale="es" description="Lo que hacemos." />);
    expect(data.description).toBe('Lo que hacemos.');
    expect(data.inLanguage).toBe('es');
  });
});

describe('JsonLd', () => {
  it('escapes a closing script tag hidden in the data', () => {
    const { script, data } = renderSchema(<JsonLd data={{ name: 'a</script><img>' }} />);
    expect(script.textContent).not.toContain('</script>');
    // Still valid JSON-LD once a parser unescapes it.
    expect(data.name).toBe('a</script><img>');
  });
});
