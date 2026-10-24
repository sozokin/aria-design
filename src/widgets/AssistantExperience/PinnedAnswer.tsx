import { useEffect, useRef, type FC as ReactFC } from 'react';
import { motion } from 'motion/react';
import { Pin } from 'lucide-react';

import CoachingCard from './CoachingCard';

import { COLLAPSE_TRANSITION } from '@/lib/motion';

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
    <motion.section
      ref={ref}
      id={pinnedAnswerId(pinned.turnId)}
      tabIndex={-1}
      aria-label={`Pinned AI Assistant answer: ${pinned.card.rep}, ${pinned.card.period}`}
      className="mt-7 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      // When content above it leaves (the team overview collapsing, another card unpinned), glide rather than jump.
      layout="position"
      transition={{ layout: COLLAPSE_TRANSITION }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
    >
      {/* The label appears once the card has landed, so it never flies in with it. */}
      <motion.p
        className="mb-2 flex items-center gap-1.5 text-xs text-text-secondary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Pin className="size-3 shrink-0" aria-hidden="true" />
        <span className="min-w-0">
          Pinned from AI Assistant · <q>{pinned.prompt}</q>
        </span>
      </motion.p>
      <CoachingCard
        card={pinned.card}
        layoutId={`coaching-card-${pinned.turnId}`}
        isPinned
        onTogglePin={onUnpin}
        onAskNextStep={onAskNextStep}
        revealRows={false}
      />
    </motion.section>
  );
};

export default PinnedAnswer;
