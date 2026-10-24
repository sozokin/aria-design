/** The dashboard column's horizontal box, so fixed surfaces can line up with it. */
export interface IColumnAnchor {
  left: number;
  width: number;
}

/** Where the collapsing team overview flies to, relative to its own centre. */
export interface ICollapseFlight {
  dx: number;
  dy: number;
  scaleX: number;
  scaleY: number;
}

/** Where the drawer toggle is fixed on mobile: the spot it occupies beside the greeting. */
export interface IToggleAnchor {
  top: number;
  right: number;
}
