import { useEffect, useRef, type FC as ReactFC } from 'react';
import { Pin } from 'lucide-react';

import CoachingCard from './CoachingCard';

import { IPinnedAnswer } from './AssistantExperience.types';

/** DOM id of one pinned card, so the Pinned list can jump to it. */
export const pinnedAnswerId = (turnId: string) => `pinned-answer-${turnId}`;

/** A coaching card once it has settled into the dashboard. Several can stack, newest first. */
const PinnedAnswer: ReactFC<IPinnedAnswer> = ({ pinned, onUnpin, onAskNextStep }) => {
  const ref = useRef<HTMLElement>(null);

  // Pinning moves the card out from under the pointer, so focus follows it.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    ref.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  return (
    <section
      ref={ref}
      id={pinnedAnswerId(pinned.turnId)}
      tabIndex={-1}
      aria-label={`Pinned AI Assistant answer: ${pinned.card.rep}, ${pinned.card.period}`}
      className="mt-7 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <p className="mb-2 flex items-center gap-1.5 text-xs text-text-secondary">
        <Pin className="size-3 shrink-0" aria-hidden="true" />
        <span className="min-w-0">
          Pinned from AI Assistant · <q>{pinned.prompt}</q>
        </span>
      </p>
      <CoachingCard
        card={pinned.card}
        isPinned
        onTogglePin={onUnpin}
        onAskNextStep={onAskNextStep}
      />
    </section>
  );
};

export default PinnedAnswer;
