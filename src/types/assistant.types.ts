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

/** A message for the live region. The id forces a DOM change even when the text repeats. */
export interface IAnnouncement {
  id: number;
  text: string;
}

/**
 * What `useAssistant` hands the host: the conversation as read-only state, plus the only actions
 * allowed to change it. Components never set this state directly, so rules such as "opening clears
 * the unseen flag" live in one place.
 */
export interface IAssistant {
  /**
   * The conversation, oldest first: one turn per question, each filled in by its own stream.
   * The panel renders from it; the latest card's next step feeds the brief.
   */
  turns: ITurn[];
  /**
   * Whether the answer panel is showing. Independent of streaming: closing only hides the panel,
   * and an answer keeps arriving behind it.
   */
  isOpen: boolean;
  /**
   * An answer finished while the panel was closed and has not been looked at since. Drives the
   * prompt bar's "Answer ready" pill. Not derivable from `isOpen` and the turn's phase, which read
   * the same after the answer has been seen and the panel closed again.
   */
  hasUnseenAnswer: boolean;
  /**
   * The latest message for screen readers: the status, then "Answer ready" with a summary of the
   * card. Text chunks are deliberately not announced. Null until something happens.
   */
  announcement: IAnnouncement | null;
  /** Adds a turn for `prompt`, opens the panel and starts streaming its answer. */
  ask: (prompt: string) => void;
  /** Shows the existing conversation again without asking anything; clears the unseen flag. */
  open: () => void;
  /** Hides the panel. Leaves the turns and any running stream untouched. */
  close: () => void;
}
