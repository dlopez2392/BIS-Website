import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/cn';

describe('cn', () => {
  it('joins truthy class names and skips falsy ones', () => {
    expect(cn('a', false, 'b', undefined, 'c')).toBe('a b c');
  });
});
