import type { CoachingRow } from '../../mock/types';
import type { TRatingBand } from '@/types/assistant.types';

export const RATING_BANDS: Record<TRatingBand, { label: string; text: string; fill: string }> = {
  strong: { label: 'Going well', text: 'text-success', fill: 'bg-success' },
  developing: { label: 'Can be improved', text: 'text-warning', fill: 'bg-warning' },
  focus: { label: 'Needs work', text: 'text-destructive', fill: 'bg-destructive' },
};

// Strongest first, which is also the order the card lists the groups in.
const BAND_ORDER: TRatingBand[] = ['strong', 'developing', 'focus'];

export const ratingBand = (score: number): TRatingBand => {
  if (score >= 4) return 'strong';
  if (score >= 3) return 'developing';
  return 'focus';
};

/** Rows grouped by band, strongest first; empty bands are left out. */
export function groupByBand(rows: CoachingRow[]) {
  return BAND_ORDER.map(band => ({
    band,
    rows: rows.filter(row => ratingBand(row.score) === band),
  })).filter(group => group.rows.length > 0);
}

export const lowestRow = (rows: CoachingRow[]) =>
  rows.reduce<CoachingRow | undefined>(
    (lowest, row) => (!lowest || row.score < lowest.score ? row : lowest),
    undefined,
  );
