import type { ReactNode } from 'react';

export interface IEntityPreview {
  /** Id of the preview card, so the trigger can point at it with aria-controls. */
  id: string;
  /** The inline chip that opens the preview. */
  label: ReactNode;
  /** The preview card's content. */
  children: ReactNode;
}

export interface IPreviewPosition {
  left: number;
  top: number;
  /** False until the card has been measured and placed, so it does not flash at 0,0. */
  ready: boolean;
}
