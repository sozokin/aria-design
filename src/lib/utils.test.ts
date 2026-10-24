import { describe, expect, it } from 'vitest';

import { getInitials } from './utils';

describe('getInitials', () => {
  it('takes the first letter of the first two words, upper-cased', () => {
    expect(getInitials('Marcus Bell')).toBe('MB');
    expect(getInitials('lena ortiz')).toBe('LO');
  });

  it('copes with one word and with more than two', () => {
    expect(getInitials('Didi')).toBe('D');
    expect(getInitials('Jordan Lee Ashby')).toBe('JL');
  });
});
