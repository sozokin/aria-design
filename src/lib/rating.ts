import type { CoachingRow } from '../../mock/types';
import type { TRatingBand } from '@/types/assistant.types';

/** Each score band's label and its Tailwind text and fill colours. */
export const RATING_BANDS: Record<TRatingBand, { label: string; text: string; fill: string }> = {
  strong: { label: 'Going well', text: 'text-success', fill: 'bg-success' },
  developing: { label: 'Can be improved', text: 'text-warning', fill: 'bg-warning' },
  focus: { label: 'Needs work', text: 'text-destructive', fill: 'bg-destructive' },
};

/** Bands from strongest to weakest. The card shows its groups in this order. */
const BAND_ORDER: TRatingBand[] = ['strong', 'developing', 'focus'];

/**
 * Puts a score (out of 5) into a band.
 *
 * @param score - A skill score from 0 to 5.
 * @returns `strong` for 4 and up, `developing` for 3 and up, otherwise `focus`.
 */
export const ratingBand = (score: number): TRatingBand => {
  if (score >= 4) return 'strong';
  if (score >= 3) return 'developing';
  return 'focus';
};

/**
 * Groups skill rows by band, strongest band first. Bands with no rows are left out.
 *
 * @param rows - The card's scored skills.
 * @returns A list of `{ band, rows }` groups.
 */
export function groupByBand(rows: CoachingRow[]) {
  return BAND_ORDER.map(band => ({
    band,
    rows: rows.filter(row => ratingBand(row.score) === band),
  })).filter(group => group.rows.length > 0);
}

/**
 * Finds the skill with the lowest score: the one to focus coaching on.
 *
 * @param rows - The card's scored skills.
 * @returns The lowest-scoring row, or `undefined` if there are none.
 */
export const lowestRow = (rows: CoachingRow[]) =>
  rows.reduce<CoachingRow | undefined>(
    (lowest, row) => (!lowest || row.score < lowest.score ? row : lowest),
    undefined,
  );
