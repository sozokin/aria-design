import type { CoachingCard, CoachingRow } from '../../../mock/types';
import type { IPinnedTurn, ITurn } from '@/types/assistant.types';
import type { IColumnAnchor } from '@/types/layout.types';

export interface IAssistantPanel {
  turns: ITurn[];
  /** Whether to move focus into the dialog on open. */
  takeFocus: boolean;
  /** Scroll position to resume at, when the reader had scrolled before closing. */
  initialScrollTop?: number;
  /** Reports the scroll position so the host can remember it across a close. */
  onScrollChange: (scrollTop: number) => void;
  /**
   * The dashboard column's box, measured once by the host and shared with the prompt bar. Passed in
   * rather than measured here, so the panel has its final width on its very first layout.
   */
  anchor: IColumnAnchor | null;
  /** The host returns focus to the entry point. */
  onDismiss: () => void;
  pinned: IPinnedTurn[];
  onPin: (turn: ITurn) => void;
  onUnpin: (turnId: string) => void;
}

export interface IAssistantExperience extends IAssistantPanel {
  /** Whether the answer surface is showing. The host owns this. */
  isOpen: boolean;
}

export interface IAnswerTurn {
  turn: ITurn;
  isPinned: boolean;
  onTogglePin: () => void;
}

export interface IStreamedText {
  /** One entry per chunk the stream delivered. */
  deltas: string[];
  streaming: boolean;
}

export interface IStatusLine {
  turn: ITurn;
}

export interface ICoachingCard {
  card: CoachingCard;
  isPinned: boolean;
  onTogglePin: () => void;
  /** When given, the suggested next step becomes a button that asks it as a follow-up. */
  onAskNextStep?: (question: string) => void;
  className?: string;
}

export interface ISkillRow {
  row: CoachingRow;
  /** The lowest score on the card gets the coaching-focus note. */
  isLowest: boolean;
}

export interface INextStepChip {
  text: string;
  /** When given, the chip is a button that asks the step as a question. */
  onAsk?: (question: string) => void;
}

export interface IPinnedAnswer {
  pinned: IPinnedTurn;
  onUnpin: () => void;
}
