import type { RefObject } from 'react';

import type { ITurn } from '@/types/assistant.types';

export interface IAssistantPanel {
  turns: ITurn[];
  /** The dashboard column the panel aligns to on desktop. */
  columnRef: RefObject<HTMLElement | null>;
  /** The host returns focus to the entry point. */
  onDismiss: () => void;
}

export interface IAssistantExperience extends IAssistantPanel {
  /** Whether the answer surface is showing. The host owns this. */
  isOpen: boolean;
}

export interface IAnswerTurn {
  turn: ITurn;
}

export interface IStreamedText {
  /** One entry per chunk the stream delivered. */
  deltas: string[];
  streaming: boolean;
}

export interface IStatusLine {
  turn: ITurn;
}
