import type { CoachingCard } from '../../mock/types';

export type TTurnPhase = 'reviewing' | 'streaming' | 'complete';

/** One question and the answer that streams in for it. */
export interface ITurn {
  id: string;
  /** The chat this turn belongs to. Turns with the same chat id form one thread. */
  chatId: string;
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

/** One chat in the history list. */
export interface IChatSummary {
  id: string;
  /** The chat's first question, which is also the panel's title for it. */
  title: string;
  /** How many questions have been asked in it. */
  turnCount: number;
  /** Who the latest coaching card is about, once one has arrived. */
  rep: string | null;
  /** An answer is still arriving in this chat. */
  isAnswering: boolean;
}

/** A turn's coaching card once it is pinned to the dashboard. */
export interface IPinnedTurn {
  turnId: string;
  prompt: string;
  card: CoachingCard;
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
   * The active chat's turns, oldest first: one per question, each filled in by its own stream.
   * The panel renders from it; the latest card's next step feeds the brief.
   */
  turns: ITurn[];
  /** The chat the panel and the prompt bar are about. A new chat has no turns until it is asked. */
  activeChatId: string;
  /** Every chat with at least one turn, most recently asked first, for the history list. */
  chats: IChatSummary[];
  /**
   * Whether the answer panel is showing. Independent of streaming: closing only hides the panel,
   * and an answer keeps arriving behind it.
   */
  isOpen: boolean;
  /**
   * Desktop only: the panel fills most of the screen, with the chats as a left pane. Remembered
   * across a close, so a reader who works expanded gets the panel back expanded.
   */
  isExpanded: boolean;
  /**
   * An answer is still arriving where the reader is not looking: in another chat, or behind a
   * closed panel. Drives the prompt bar's pulse.
   */
  isAnswering: boolean;
  /**
   * An answer finished out of view (behind a closed panel, or in a chat the reader had left) and
   * has not been looked at since. Drives the prompt bar's "Answer ready" pill. Not derivable from
   * `isOpen` and the turns' phases, which read the same once the answer has been seen.
   */
  hasUnseenAnswer: boolean;
  /**
   * The latest message for screen readers: the status, then "Answer ready" with a summary of the
   * card, and pin and undo. Text chunks are deliberately not announced, and unpin is left to its
   * toast. Null until something happens.
   */
  announcement: IAnnouncement | null;
  /**
   * Coaching cards pinned to the dashboard, newest first. Outlives the panel: the dashboard and
   * the rail's Pinned list render from it while the panel is closed.
   */
  pinned: IPinnedTurn[];
  /** Adds a turn for `prompt`, opens the panel and starts streaming its answer. */
  ask: (prompt: string) => void;
  /** Shows the existing conversation again without asking anything; clears the unseen flag. */
  open: () => void;
  /** Hides the panel. Leaves the turns and any running stream untouched. */
  close: () => void;
  /** Expands the panel to most of the screen, or brings it back to its usual size. */
  setExpanded: (expanded: boolean) => void;
  /**
   * Makes a fresh, empty chat active and opens the panel on its empty state. If the active chat has
   * not been asked anything yet, it already is that fresh chat, so only the panel opens.
   */
  newChat: () => void;
  /** Makes an earlier chat active and opens the panel on it. */
  switchChat: (chatId: string) => void;
  /** Shows the answer that finished out of view, switching to its chat if the reader has moved on. */
  openUnseenAnswer: () => void;
  /** Pins a turn's card to the top of the dashboard and closes the panel. Ignored without a card. */
  pin: (turn: ITurn) => void;
  /**
   * Takes a card off the dashboard and keeps it, with its position, for `UNDO_WINDOW_MS`. Each
   * unpin has its own undo, so two quick unpins can both be restored.
   */
  unpin: (turnId: string) => void;
  /** Puts one unpinned card back where it was, if its undo window is still open. */
  undoUnpin: (turnId: string) => void;
}

/** Scores are out of 5; the band decides a row's grouping and colour on the card. */
export type TRatingBand = 'strong' | 'developing' | 'focus';
