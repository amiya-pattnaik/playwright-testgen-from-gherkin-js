import { describe, it, expect } from 'vitest';
import { generateShortName } from '../../utils';

describe('generateShortName', () => {
  it('removes quotes and creates camelCase', () => {
    const input = 'User clicks on "login button"';
    const result = generateShortName(input);
    expect(result).toBe('loginButton');
  });
});
