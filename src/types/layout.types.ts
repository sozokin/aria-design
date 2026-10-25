/** Where the dashboard column sits across the screen, so fixed items can line up with it. */
export interface IColumnAnchor {
  /** Distance from the left edge of the screen, in pixels. */
  left: number;
  /** The column's width, in pixels. */
  width: number;
}

/** How the collapsing team overview moves and shrinks to land on the menu toggle. */
export interface ICollapseFlight {
  /** How far to move sideways, from the block's centre, in pixels. */
  dx: number;
  /** How far to move down, from the block's centre, in pixels. */
  dy: number;
  /** How much to shrink the width (1 = no change). */
  scaleX: number;
  /** How much to shrink the height (1 = no change). */
  scaleY: number;
}

/** Where the menu toggle is fixed on mobile: the spot beside the greeting. */
export interface IToggleAnchor {
  /** Distance from the top of the page, in pixels. */
  top: number;
  /** Distance from the right edge of the screen, in pixels. */
  right: number;
}
