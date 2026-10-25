import { type FC as ReactFC } from 'react';
import { Check } from 'lucide-react';

import { statusLabel } from '@/lib/stream';

import { IStatusLine } from './AssistantExperience.types';

/**
 * A single line showing the answer's progress: a pulsing dot while it works, a check when done.
 * Screen readers hear progress from the live region, not from this line.
 */
const StatusLine: ReactFC<IStatusLine> = ({ turn }) => (
  <p className="flex min-h-5 items-center gap-2 text-xs text-text-secondary">
    {turn.phase === 'complete' ? (
      <Check className="size-3.5 text-success" aria-hidden="true" />
    ) : (
      <span className="flex size-3.5 items-center justify-center" aria-hidden="true">
        <span className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
      </span>
    )}
    <span>{statusLabel(turn)}</span>
  </p>
);

export default StatusLine;
