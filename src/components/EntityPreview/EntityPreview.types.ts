import type { ReactNode } from 'react';

/** Props for `EntityPreview`. */
export interface IEntityPreview {
  /** The preview card's id, so the chip can point to it (`aria-controls`). */
  id: string;
  /** The chip shown in the text, which opens the preview. */
  label: ReactNode;
  /** What the preview card shows. */
  children: ReactNode;
}

/** Where the preview card is placed on screen. */
export interface IPreviewPosition {
  /** Distance from the left edge of the screen, in pixels. */
  left: number;
  /** Distance from the top of the screen, in pixels. */
  top: number;
  /** False until the card has been measured and placed, so it never flashes in the corner. */
  ready: boolean;
}
