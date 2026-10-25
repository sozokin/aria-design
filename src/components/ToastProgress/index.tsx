import { type FC as ReactFC } from 'react';

import { IToastProgress } from './ToastProgress.types';

/**
 * A thin bar along the bottom of a toast that fills from left to right, at a steady speed, over
 * the toast's lifetime, so the time left to act is visible.
 *
 * It is also the toast's timer: when it is full, `onComplete` closes the toast. It is only
 * visual; the time limit is also read out to screen readers in the toast's text.
 */
const ToastProgress: ReactFC<IToastProgress> = ({ durationMs, onComplete }) => (
  // Sits at the bottom of the toast (sonner places each toast), inside its 1px border.
  <span
    className="pointer-events-none absolute inset-x-0 bottom-0 h-0.75 overflow-hidden rounded-b-[calc(var(--radius)-1px)]"
    aria-hidden="true"
  >
    <span
      className="block h-full origin-left bg-info-muted-foreground"
      style={{ animation: `toast-progress ${durationMs}ms linear forwards` }}
      onAnimationEnd={onComplete}
    />
  </span>
);

export default ToastProgress;
