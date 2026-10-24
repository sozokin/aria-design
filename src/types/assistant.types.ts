import type { CoachingCard } from '../../mock/types';

export type TTurnPhase = 'reviewing' | 'streaming' | 'complete';

/** One question and the answer that streams in for it. */
export interface ITurn {
  id: string;
  prompt: string;
  phase: TTurnPhase;
  /** Progress label from the stream, e.g. "Reviewing 6 discovery calls". */
  status: string;
  /** Answer text accumulated from the text deltas. */
  text: string;
  /** The same text as it arrived, one entry per delta, so each can fade in on its own. */
  deltas: string[];
  card: CoachingCard | null;
}
