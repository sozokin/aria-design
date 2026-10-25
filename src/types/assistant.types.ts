import type { CoachingCard } from '../../mock/types';

/** Where an answer is: waiting for text, receiving text, or finished. */
export type TTurnPhase = 'reviewing' | 'streaming' | 'complete';

/** One question and the answer that streams in for it. */
export interface ITurn {
  /** The turn's id. */
  id: string;
  /** The chat this turn belongs to. Turns with the same chat id make one conversation. */
  chatId: string;
  /** The question that was asked. */
  prompt: string;
  /** How far the answer has got. */
  phase: TTurnPhase;
  /** The progress label from the stream, for example "Reviewing 6 discovery calls". */
  status: string;
  /** The answer text so far. */
  text: string;
  /** The same text, one entry per chunk as it arrived, so each chunk can fade in on its own. */
  deltas: string[];
  /** The coaching card, once it has arrived. */
  card: CoachingCard | null;
}

/** One chat in the chat history list. */
export interface IChatSummary {
  /** The chat's id. */
  id: string;
  /** The chat's first question. The panel uses it as the chat's title too. */
  title: string;
  /** How many questions have been asked in it. */
  turnCount: number;
  /** Who the latest coaching card is about, once a card has arrived. */
  rep: string | null;
  /** True while an answer is still arriving in this chat. */
  isAnswering: boolean;
}

/** A coaching card that has been pinned to the dashboard. */
export interface IPinnedTurn {
  /** The turn the card came from. */
  turnId: string;
  /** The question the card answered. */
  prompt: string;
  /** The card itself. */
  card: CoachingCard;
  /** True when Undo put it back: it reopens in its old place instead of arriving from the panel. */
  restored?: boolean;
}

/** A message for screen readers. A new id makes the same text be read again. */
export interface IAnnouncement {
  id: number;
  text: string;
}

/**
 * What `useAssistant` gives `App`: the AI Assistant's state (read only) and the only actions that
 * may change it.
 *
 * Components never change this state directly. That keeps rules such as "opening a chat clears
 * its unseen mark" in one place.
 */
export interface IAssistant {
  /**
   * The active chat's turns, oldest first. The panel shows these, and the latest card's next step
   * also appears in the brief.
   */
  turns: ITurn[];
  /** The chat the panel and prompt bar are about. A new chat has no turns until it is asked. */
  activeChatId: string;
  /** Every chat with at least one question, newest first, for the chat history. */
  chats: IChatSummary[];
  /** Whether the panel is on screen. Closing it only hides it: an answer keeps arriving. */
  isOpen: boolean;
  /**
   * Desktop only: the panel fills most of the screen, with the chats in a left pane. Remembered
   * after closing, so it comes back the same way.
   */
  isExpanded: boolean;
  /**
   * True while an answer is still arriving somewhere the reader is not looking (another chat, or
   * behind a closed panel). Shows the pulsing dot in the prompt bar.
   */
  isAnswering: boolean;
  /**
   * True when an answer finished out of sight and has not been opened yet. Shows the "Answer
   * ready" pill in the prompt bar. (It cannot be worked out from the other values, because they
   * look the same before and after the reader has seen the answer.)
   */
  hasUnseenAnswer: boolean;
  /**
   * The latest message for screen readers: the status, then "Answer ready" with a short summary
   * of the card, then pin and undo. Text chunks are never announced, and the unpin toast speaks
   * for itself. `null` until something happens.
   */
  announcement: IAnnouncement | null;
  /** Cards pinned to the dashboard, newest first. They stay when the panel closes. */
  pinned: IPinnedTurn[];
  /** Asks `prompt` in the active chat: opens the panel and starts streaming the answer. */
  ask: (prompt: string) => void;
  /** Opens the panel on the active chat without asking anything. Clears its unseen mark. */
  open: () => void;
  /** Hides the panel. Chats and any answer still arriving are left alone. */
  close: () => void;
  /**
   * Hides the panel, then runs `action` once the panel has left the screen (`App` reports that
   * with `onClosed`). This way a change to the dashboard happens where the reader can see it.
   * If the panel is already hidden, `action` runs straight away.
   */
  closeThen: (action: () => void) => void;
  /** `App` calls this when the panel has left the screen; runs what `closeThen` was holding. */
  onClosed: () => void;
  /** Expands the panel to most of the screen, or back to its normal size. */
  setExpanded: (expanded: boolean) => void;
  /**
   * Starts a new, empty chat and opens the panel on it. If the active chat has no questions yet,
   * it already is a new chat, so only the panel opens.
   */
  newChat: () => void;
  /** Opens an earlier chat in the panel. */
  switchChat: (chatId: string) => void;
  /** Opens the answer that finished out of sight, switching chats if needed. */
  openUnseenAnswer: () => void;
  /** Pins a turn's card to the top of the dashboard and closes the panel. Does nothing without a card. */
  pin: (turn: ITurn) => void;
  /**
   * Takes a card off the dashboard and keeps it, with its place, for `UNDO_WINDOW_MS`.
   * Each unpin can be undone on its own.
   */
  unpin: (turnId: string) => void;
  /** Puts an unpinned card back in its old place, if its undo time has not run out. */
  undoUnpin: (turnId: string) => void;
}

/** A score's band. Scores are out of 5; the band sets a skill's group and colour on the card. */
export type TRatingBand = 'strong' | 'developing' | 'focus';
