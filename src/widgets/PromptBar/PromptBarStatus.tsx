import { type FC as ReactFC } from 'react';

import { Badge } from '@/components/ui/badge';

import { IPromptBarStatus } from './PromptBar.types';

/**
 * A small status inside the prompt bar while the panel is closed: a pulsing dot while an answer is
 * being worked on, an "Answer ready" pill when one finished behind the closed panel. Nothing while
 * the panel is open, so the input keeps its full width.
 */
const PromptBarStatus: ReactFC<IPromptBarStatus> = ({
  latestTurn,
  isPanelOpen,
  hasUnseenAnswer,
  onReopen,
}) => {
  if (!latestTurn || isPanelOpen) return null;

  if (hasUnseenAnswer) {
    return (
      <span className="relative shrink-0">
        {/* Radiates until the pill is clicked or the panel opens, which unmounts the pill. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-accent motion-safe:animate-ready-pulse"
        />
        <Badge
          asChild
          variant="secondary"
          className="relative h-6 gap-1.5 bg-accent-muted px-2.5 text-accent-muted-foreground hover:bg-[color-mix(in_oklch,var(--accent-muted),var(--accent)_8%)]"
        >
          <button type="button" onClick={onReopen}>
            <span
              className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse"
              aria-hidden="true"
            />
            Answer ready
            <span className="sr-only">. Open the answer</span>
          </button>
        </Badge>
      </span>
    );
  }

  if (latestTurn.phase !== 'complete') {
    return (
      <button
        type="button"
        onClick={onReopen}
        aria-label="Answer in progress. Open the answer"
        className="flex size-6 shrink-0 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span
          className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse"
          aria-hidden="true"
        />
      </button>
    );
  }

  return null;
};

export default PromptBarStatus;
