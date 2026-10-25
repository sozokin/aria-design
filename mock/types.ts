/** One scored skill on a coaching card. */
export type CoachingRow = {
  id: string;
  skill: string;
  /** Out of 5. */
  score: number;
  /** A short quote or note from the calls that backs up the score. */
  evidence: string;
};

/** The structured answer: who it is about, a summary, scored skills and one next step. */
export type CoachingCard = {
  rep: string;
  period: string;
  summary: string;
  rows: CoachingRow[];
  nextStep: string;
};

/** One event from the answer stream. */
export type StreamEvent =
  | { type: 'status'; label: string }
  | { type: 'text'; delta: string }
  | { type: 'artifact'; kind: 'coaching-card'; data: CoachingCard }
  | { type: 'done' };
