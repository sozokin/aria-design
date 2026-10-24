import type { Ref } from 'react';

import type { IColumnAnchor } from '@/types/layout.types';

export interface IPromptBarStatus {
  /** An answer is arriving where the reader is not looking. */
  isAnswering: boolean;
  /** An answer finished out of view and has not been looked at. */
  hasUnseenAnswer: boolean;
  /** Shows that answer. */
  onReopen: () => void;
}

export interface IPromptBar extends IPromptBarStatus {
  ref: Ref<HTMLTextAreaElement>;
  /** Whether the panel is showing: with an empty bar the send arrow closes it rather than opens it. */
  isPanelOpen: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  /** Focusing, clicking or typing in the bar. The host uses it to bring a closed panel back. */
  onInteract: () => void;
  /** A question has been asked, so the bar now invites a follow-up. */
  hasThread: boolean;
  /** Centres the bar on the dashboard column on desktop; null on mobile, where CSS docks it. */
  anchor: IColumnAnchor | null;
  /** The plus beside the bar: starts a new chat. */
  onNewChat: () => void;
  /** How many lines the bar is showing (one to three), so the host can raise what sits above it. */
  onLinesChange: (lines: number) => void;
}
