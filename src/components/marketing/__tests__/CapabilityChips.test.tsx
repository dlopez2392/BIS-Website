import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapabilityChips } from '../CapabilityChips';

describe('CapabilityChips', () => {
  it('renders the heading and one chip per item', () => {
    render(<CapabilityChips heading="Networking" items={['Cisco', 'Fortinet', 'Ubiquiti']} />);
    expect(screen.getByRole('heading', { name: 'Networking' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Fortinet')).toBeTruthy();
  });
});
