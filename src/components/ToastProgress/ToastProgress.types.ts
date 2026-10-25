/** Props for `ToastProgress`. */
export interface IToastProgress {
  /** How long the bar takes to fill, in milliseconds: the toast's whole time on screen. */
  durationMs: number;
  /** Called when the bar is full. `App` closes the toast here. */
  onComplete: () => void;
}
