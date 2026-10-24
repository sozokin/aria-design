import { type FC as ReactFC } from 'react';

import { IToastProgress } from './ToastProgress.types';

/**
 * A bar along the bottom of a toast that fills left to right, linearly, over the toast's lifetime,
 * so the time left to act is visible. It is the toast's clock: when the fill ends, `onComplete`
 * dismisses the toast. Purely visual; the time limit is also stated in the announcement.
 */
const ToastProgress: ReactFC<IToastProgress> = ({ durationMs, onComplete }) => (
  // Anchored to the toast itself (sonner positions every toast), inside its 1px border.
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
