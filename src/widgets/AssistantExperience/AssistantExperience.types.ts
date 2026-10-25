import type { ReactNode, RefObject } from 'react';

import type { CoachingCard, CoachingRow } from '../../../mock/types';
import type { IAnnouncement, IChatSummary, IPinnedTurn, ITurn } from '@/types/assistant.types';
import type { IColumnAnchor } from '@/types/layout.types';

/** Props for `ChatList`. */
export interface IChatList {
  /** Every chat with at least one question, newest first. */
  chats: IChatSummary[];
  /** The chat the panel is showing; it is highlighted in the list. */
  activeChatId: string;
  /** Called with a chat's id when the reader picks it. */
  onSwitchChat: (chatId: string) => void;
}

/** Props for `ChatHistory`. */
export interface IChatHistory extends IChatList {
  /** Show the words "Chat history" next to the icon, not just the icon. */
  withLabel?: boolean;
  /**
   * Called once the sheet has closed after a chat was picked. In that case focus does not go back
   * to the History button; `App` moves it to the panel showing the chat instead.
   */
  onChoiceClosed?: () => void;
}

/** The two prompt bar controls that the open panel sits between when tabbing. */
export interface IEntryPoint {
  /** The question field. Tab from here goes into the panel. */
  field: RefObject<HTMLTextAreaElement | null>;
  /** The send button. Tab from the panel's last control comes here. */
  send: RefObject<HTMLButtonElement | null>;
}

/** Props for `AssistantPanel`. */
export interface IAssistantPanel extends IChatList {
  /** The active chat's turns. Empty for a new chat. */
  turns: ITurn[];
  /** Desktop only: fill most of the screen, with the chats in a left pane. */
  isExpanded: boolean;
  /** Called when the reader expands the panel or shrinks it back. */
  onExpandedChange: (expanded: boolean) => void;
  /** Called by the left pane's New chat button. */
  onNewChat: () => void;
  /** A first question to suggest while the chat is empty. */
  suggestedQuestion: string;
  /** Whether to move focus into the panel when it opens. */
  takeFocus: boolean;
  /**
   * Raise this number to move focus into the panel while it is already open. Ignored if focus is
   * already inside, so the control the reader is on keeps it.
   */
  focusRequest: number;
  /** Where to scroll to on open, if the reader had scrolled before closing. */
  initialScrollTop?: number;
  /** Reports the scroll position, so `App` can remember it after the panel closes. */
  onScrollChange: (scrollTop: number) => void;
  /**
   * Where the dashboard column is. Measured by `App` (and shared with the prompt bar) so the panel
   * has the right width from its very first frame.
   */
  anchor: IColumnAnchor | null;
  /** Called by Escape and the close button. `App` then moves focus to the send button. */
  onDismiss: () => void;
  /**
   * The prompt bar's field and send button. The panel comes before the bar on the page, so while
   * it is open it fits itself between them when tabbing: field → panel → send button.
   */
  entryPoint: IEntryPoint;
  /** Cards pinned to the dashboard, to show each card's Pin or Unpin. */
  pinned: IPinnedTurn[];
  /** Asks a follow-up in this chat (for example the card's suggested next step). */
  onAsk: (question: string) => void;
  /** Pins a turn's card. */
  onPin: (turn: ITurn) => void;
  /** Unpins a card by its turn id. */
  onUnpin: (turnId: string) => void;
}

/** Props for `AssistantExperience`: the panel's props, plus whether it is open. */
export interface IAssistantExperience extends IAssistantPanel {
  /** Whether the panel is on screen. `App` owns this. */
  isOpen: boolean;
  /** Called once the panel has finished leaving the screen. */
  onClosed: () => void;
}

/** Props for `AnswerTurn`. */
export interface IAnswerTurn {
  /** The question and its answer so far. */
  turn: ITurn;
  /** True for every question after the first; it is shown as a message bubble. */
  isFollowUp: boolean;
  /** Whether this turn's card is pinned. */
  isPinned: boolean;
  /**
   * Whether the card takes part in the "fly to the dashboard" pin animation. Off in the expanded
   * panel: its content is rebuilt when the panel changes size, and the animation would make the
   * new card fly in from the old card's place.
   */
  shareCardLayout: boolean;
  /** Pins or unpins the card. */
  onTogglePin: () => void;
  /** Asks the card's suggested next step. */
  onAskNextStep: (question: string) => void;
}

/** Props for `Reveal`. */
export interface IReveal {
  /** True once the real content is ready to show. */
  ready: boolean;
  /** What to show until then. */
  skeleton: ReactNode;
  className?: string;
  /** The real content. */
  children: ReactNode;
}

/** Props for `StreamedText`. */
export interface IStreamedText {
  /** The answer text, one entry per chunk as it arrived. */
  deltas: string[];
  /** True while more text is still coming (shows the blinking caret). */
  streaming: boolean;
}

/** Props for `StatusLine`. */
export interface IStatusLine {
  turn: ITurn;
}

/** Props for `CoachingCard`. */
export interface ICoachingCard {
  /** The card's content. */
  card: CoachingCard;
  /** Id for the "fly to the dashboard" pin animation. Leave out to skip that animation. */
  layoutId?: string;
  /** Whether the card is pinned (the button then reads Unpin). */
  isPinned: boolean;
  /** Pins or unpins the card. */
  onTogglePin: () => void;
  /** When given, the suggested next step becomes a button that asks it as a follow-up. */
  onAskNextStep?: (question: string) => void;
  /**
   * Open the card in steps the first time it shows: the header and summary first, then each
   * score group and the footer in turn. Off for the pinned copy, which appears whole.
   */
  unfold?: boolean;
  className?: string;
}

/** Props for `SkillRow`. */
export interface ISkillRow {
  /** The scored skill. */
  row: CoachingRow;
  /** Seconds to wait before the row appears, counted from when the card first shows. */
  delay: number;
  /** True for the card's lowest score; it gets an info button with a coaching note. */
  isLowest: boolean;
  /** Animate the row in. Off for the pinned copy. */
  reveal: boolean;
}

/** Props for `NextStepChip`. */
export interface INextStepChip {
  /** The suggested next step. */
  text: string;
  /** When given, the chip is a button that asks the step as a question. */
  onAsk?: (question: string) => void;
}

/** Props for `PinnedAnswer`. */
export interface IPinnedAnswer {
  /** The pinned card and the question it answered. */
  pinned: IPinnedTurn;
  /**
   * Whether the card flies in from the panel. Off on mobile: there the card's spot is further
   * down the page, so the page scrolls to it and the card rises into place instead.
   */
  shareCardLayout: boolean;
  /** Unpins the card. */
  onUnpin: () => void;
  /** Asks the card's suggested next step. */
  onAskNextStep: (question: string) => void;
}

/** Props for `LiveAnnouncer`. */
export interface ILiveAnnouncer {
  /** The message to read out, or `null` for none. */
  announcement: IAnnouncement | null;
}
