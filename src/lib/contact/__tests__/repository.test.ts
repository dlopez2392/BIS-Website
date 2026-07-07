import { describe, it, expect, vi, beforeEach } from 'vitest';

const { returning, values, insert } = vi.hoisted(() => {
  const returning = vi.fn();
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));
  return { returning, values, insert };
});

vi.mock('@/db', () => ({ db: { insert } }));
vi.mock('@/db/schema', () => ({ leads: { __table: 'leads' } }));

import { insertLead } from '../repository';

describe('insertLead', () => {
  beforeEach(() => { insert.mockClear(); values.mockClear(); returning.mockClear(); });

  it('inserts the mapped row and returns the new id', async () => {
    returning.mockResolvedValueOnce([{ id: 'lead-123' }]);
    const result = await insertLead({
      fullName: 'Ana', businessName: 'Acme', email: 'ana@acme.com',
      phone: '956', industry: 'legal', language: 'en', message: '',
    });
    expect(insert).toHaveBeenCalledWith({ __table: 'leads' });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@acme.com', fullName: 'Ana' }));
    expect(result).toEqual({ id: 'lead-123' });
  });
});
