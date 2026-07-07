import { describe, it, expect } from 'vitest';
import { toLeadRow } from '../to-lead-row';

describe('toLeadRow', () => {
  it('maps validated form values to a lead insert row', () => {
    const row = toLeadRow({
      fullName: 'Ana Reyes', businessName: 'Reyes Law', email: 'ana@reyeslaw.com',
      phone: '956-555-0100', industry: 'legal', language: 'es', message: '',
    });
    expect(row).toEqual({
      fullName: 'Ana Reyes', businessName: 'Reyes Law', email: 'ana@reyeslaw.com',
      phone: '956-555-0100', industry: 'legal', language: 'es', message: '',
    });
  });
});
