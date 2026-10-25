import type { Ref } from 'react';

import type { IColumnAnchor } from '@/types/layout.types';

/** Props for `PromptBarStatus`. */
export interface IPromptBarStatus {
  /** True while an answer is arriving somewhere the reader is not looking. */
  isAnswering: boolean;
  /** True when an answer finished out of sight and has not been opened yet. */
  hasUnseenAnswer: boolean;
  /** Opens that answer. */
  onReopen: () => void;
}

/** Props for `PromptBar`. */
export interface IPromptBar extends IPromptBarStatus {
  /** The question field. */
  ref: Ref<HTMLTextAreaElement>;
  /** The send button. Focus goes back here when the panel is closed. */
  sendButtonRef: Ref<HTMLButtonElement>;
  /** Whether the panel is open. With an empty bar, the send arrow then closes it instead of opening it. */
  isPanelOpen: boolean;
  /** The text in the field. */
  value: string;
  /** Called when the text changes. */
  onValueChange: (value: string) => void;
  /** Called by the send button (and by Enter on desktop). */
  onSubmit: () => void;
  /** Called on focusing, clicking or typing in the field. `App` uses it to reopen a closed panel. */
  onInteract: () => void;
  /** True once a question has been asked, so the bar asks for a follow-up instead. */
  hasThread: boolean;
  /** Desktop: where the dashboard column is, so the bar can centre on it. `null` on mobile. */
  anchor: IColumnAnchor | null;
  /** Called by the + button beside the bar: starts a new chat. */
  onNewChat: () => void;
  /** Reports how many lines the field shows (1 to 3), so things above the bar can move up. */
  onLinesChange: (lines: number) => void;
}
