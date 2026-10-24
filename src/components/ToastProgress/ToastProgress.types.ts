export interface IToastProgress {
  /** How long the bar takes to fill: the toast's whole time on screen. */
  durationMs: number;
  /** Fires when the bar is full; the host dismisses the toast here. */
  onComplete: () => void;
}
