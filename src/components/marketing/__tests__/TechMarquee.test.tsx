import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TechMarqueeView } from '../TechMarquee';

const logos = [
  { name: 'Microsoft', file: 'microsoft' },
  { name: 'Cisco', file: 'cisco' },
];

describe('TechMarqueeView', () => {
  it('renders the label and exactly one accessible logo per roster entry', () => {
    render(<TechMarqueeView label="Platforms we work with" logos={logos} />);
    expect(screen.getByText('Platforms we work with')).toBeTruthy();
    const marks = screen.getAllByRole('img');
    expect(marks).toHaveLength(2); // duplicated loop copy is aria-hidden, not counted
    expect(screen.getByRole('img', { name: 'Microsoft' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Cisco' })).toBeTruthy();
  });
});
