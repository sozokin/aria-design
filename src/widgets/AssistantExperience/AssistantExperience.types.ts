import type { ReactNode } from 'react';

import type { CoachingCard, CoachingRow } from '../../../mock/types';
import type { IAnnouncement, IChatSummary, IPinnedTurn, ITurn } from '@/types/assistant.types';
import type { IColumnAnchor } from '@/types/layout.types';

export interface IChatList {
  /** Every chat with turns, most recently asked first. */
  chats: IChatSummary[];
  activeChatId: string;
  onSwitchChat: (chatId: string) => void;
}

export interface IChatHistory extends IChatList {
  /** Icon and "Chat history" rather than the icon alone. */
  withLabel?: boolean;
}

export interface IAssistantPanel extends IChatList {
  /** The active chat's turns. Empty for a chat nothing has been asked in yet. */
  turns: ITurn[];
  /** Desktop only: most of the screen, with the chats as a left pane, instead of the usual panel. */
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** The left pane's New chat button. */
  onNewChat: () => void;
  /** Offered as a first question while the chat is empty. */
  suggestedQuestion: string;
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
  /** Asks a follow-up in this thread (the card's suggested next step). */
  onAsk: (question: string) => void;
  onPin: (turn: ITurn) => void;
  onUnpin: (turnId: string) => void;
}

export interface IAssistantExperience extends IAssistantPanel {
  /** Whether the answer surface is showing. The host owns this. */
  isOpen: boolean;
}

export interface IAnswerTurn {
  turn: ITurn;
  /** Follow-up turns show the question as a message bubble above the answer. */
  isFollowUp: boolean;
  isPinned: boolean;
  /**
   * Whether the card carries the shared layout id that lets a pin fly it to the dashboard. Off in
   * the expanded panel: the panel's content remounts when it changes form, and a shared id would
   * make the new card fly in from where the old one was, scaled and out of the box.
   */
  shareCardLayout: boolean;
  onTogglePin: () => void;
  onAskNextStep: (question: string) => void;
}

export interface IReveal {
  ready: boolean;
  skeleton: ReactNode;
  className?: string;
  children: ReactNode;
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
  /** Shared-element id for the pin move. Omit to opt out of the shared transition. */
  layoutId?: string;
  isPinned: boolean;
  onTogglePin: () => void;
  /** When given, the suggested next step becomes a button that asks it as a follow-up. */
  onAskNextStep?: (question: string) => void;
  /**
   * The card unfolds on first render: the header and summary at once, then each rating band and
   * the footer in turn, with the rows staggering in as their band opens. Off for the pinned copy,
   * which arrives whole.
   */
  unfold?: boolean;
  className?: string;
}

export interface ISkillRow {
  row: CoachingRow;
  /** Seconds before the row appears, counted from the card's first render. */
  delay: number;
  /** The lowest score on the card gets the coaching-focus note. */
  isLowest: boolean;
  reveal: boolean;
}

export interface INextStepChip {
  text: string;
  /** When given, the chip is a button that asks the step as a question. */
  onAsk?: (question: string) => void;
}

export interface IPinnedAnswer {
  pinned: IPinnedTurn;
  onUnpin: () => void;
  onAskNextStep: (question: string) => void;
}

export interface ILiveAnnouncer {
  announcement: IAnnouncement | null;
}
