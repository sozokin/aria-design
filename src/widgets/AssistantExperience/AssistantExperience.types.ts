import type { ReactNode, RefObject } from 'react';

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
  /**
   * The sheet has closed after a chat was chosen. Focus is not returned to the History button then;
   * the host moves it to the panel showing that chat.
   */
  onChoiceClosed?: () => void;
}

/** The prompt bar's controls that the open panel sits between in the tab order. */
export interface IEntryPoint {
  /** The question field: Tab from it enters the panel. */
  field: RefObject<HTMLTextAreaElement | null>;
  /** The send button: Tab from the panel's last control lands here. */
  send: RefObject<HTMLButtonElement | null>;
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
  /**
   * Raised by the host to move focus into the already open dialog. Ignored while focus is inside it,
   * so a control the reader is on keeps focus.
   */
  focusRequest: number;
  /** Scroll position to resume at, when the reader had scrolled before closing. */
  initialScrollTop?: number;
  /** Reports the scroll position so the host can remember it across a close. */
  onScrollChange: (scrollTop: number) => void;
  /**
   * The dashboard column's box, measured once by the host and shared with the prompt bar. Passed in
   * rather than measured here, so the panel has its final width on its very first layout.
   */
  anchor: IColumnAnchor | null;
  /** The host returns focus to the entry point (the prompt bar's send button). */
  onDismiss: () => void;
  /**
   * The prompt bar's field and send button. The panel renders before the bar, so while it is open
   * it places itself between them in the tab order: field → panel → send button.
   */
  entryPoint: IEntryPoint;
  pinned: IPinnedTurn[];
  /** Asks a follow-up in this thread (the card's suggested next step). */
  onAsk: (question: string) => void;
  onPin: (turn: ITurn) => void;
  onUnpin: (turnId: string) => void;
}

export interface IAssistantExperience extends IAssistantPanel {
  /** Whether the answer surface is showing. The host owns this. */
  isOpen: boolean;
  /** The surface has finished leaving: the host runs what waited for that. */
  onClosed: () => void;
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
  /**
   * Whether the card carries the shared layout id, so it glides in from where it was in the panel.
   * Off on mobile: there the slot is below the fold and the page scrolls to it, so the card rises
   * into place as the scroll settles instead of gliding against it.
   */
  shareCardLayout: boolean;
  onUnpin: () => void;
  onAskNextStep: (question: string) => void;
}

export interface ILiveAnnouncer {
  announcement: IAnnouncement | null;
}
