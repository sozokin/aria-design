import { describe, expect, it } from 'vitest';

import { groupByBand, lowestRow, ratingBand } from './rating';

describe('rating bands', () => {
  it('maps the mock scores to the three bands in order', () => {
    expect(ratingBand(4.1)).toBe('strong');
    expect(ratingBand(3.8)).toBe('developing');
    expect(ratingBand(2.9)).toBe('focus');
  });

  it('puts the boundary scores in the higher band', () => {
    expect(ratingBand(4)).toBe('strong');
    expect(ratingBand(3.99)).toBe('developing');
    expect(ratingBand(3)).toBe('developing');
    expect(ratingBand(2.99)).toBe('focus');
  });

  it('drops empty bands and keeps strongest first', () => {
    const groups = groupByBand([
      { id: 'a', skill: 'A', score: 2.5, evidence: '' },
      { id: 'b', skill: 'B', score: 4.5, evidence: '' },
    ]);
    expect(groups.map(group => group.band)).toEqual(['strong', 'focus']);
  });

  it('finds the lowest-scoring row for the coaching focus note', () => {
    const rows = [
      { id: 'a', skill: 'A', score: 4.1, evidence: '' },
      { id: 'b', skill: 'B', score: 2.9, evidence: '' },
      { id: 'c', skill: 'C', score: 3.8, evidence: '' },
    ];
    expect(lowestRow(rows)?.id).toBe('b');
    expect(lowestRow([])).toBeUndefined();
  });
});
