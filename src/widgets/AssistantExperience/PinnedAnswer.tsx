import { useEffect, useRef, useState, type FC as ReactFC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Pin } from 'lucide-react';

import CoachingCard from './CoachingCard';

import { COLLAPSE_TRANSITION, EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { IPinnedAnswer } from './AssistantExperience.types';

/**
 * Seconds to wait before a pinned card appears, when it does not fly in from the panel (mobile).
 * This gives the page time to scroll most of the way to the card's spot first.
 */
const ARRIVE_DELAY = 0.3;

/**
 * The DOM id of a pinned card, so the Pinned list can jump to it.
 *
 * @param turnId - The turn the card came from.
 * @returns The element id.
 */
export const pinnedAnswerId = (turnId: string) => `pinned-answer-${turnId}`;

/**
 * A coaching card pinned to the dashboard, with a label naming the question it answered.
 * Several can stack, newest first.
 *
 * How it arrives:
 * - Pinned on desktop: it flies in from the panel.
 * - Pinned on mobile: it rises into place once the page has scrolled to it.
 * - Put back by Undo: it reopens in its old place, like the unpin played backwards.
 */
const PinnedAnswer: ReactFC<IPinnedAnswer> = ({
  pinned,
  shareCardLayout,
  onUnpin,
  onAskNextStep,
}) => {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  /** True while a card put back by Undo opens up. It is clipped, so it does not spill out. */
  const [isOpening, setIsOpening] = useState(Boolean(pinned.restored));

  // Pinning moves the card away from the pointer, so focus follows the card. A card put back by
  // Undo has no height yet, so it is scrolled into view later, once it has opened.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    if (!pinned.restored) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [pinned.restored]);

  /** Motion props for how the card arrives (see the list above). */
  const arrival = pinned.restored
    ? {
        initial: { height: 0, marginTop: 0, opacity: 0 },
        // 1.75rem matches the card's normal `mt-7` gap.
        animate: { height: 'auto', marginTop: '1.75rem', opacity: 1 },
        transition: { ...COLLAPSE_TRANSITION, opacity: { duration: 0.3, delay: 0.2 } },
      }
    : shareCardLayout
      ? { animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: {
            opacity: { duration: 0.3, delay: ARRIVE_DELAY },
            y: { duration: 0.45, delay: ARRIVE_DELAY, ease: EASE_OUT },
          },
        };

  return (
    <motion.section
      ref={ref}
      id={pinnedAnswerId(pinned.turnId)}
      tabIndex={-1}
      aria-label={`Pinned AI Assistant answer: ${pinned.card.rep}, ${pinned.card.period}`}
      className={cn(
        'mt-7 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        isOpening && 'overflow-hidden',
      )}
      // When something above it leaves (the overview collapsing, another card unpinned), glide up.
      layout="position"
      {...arrival}
      transition={{ layout: COLLAPSE_TRANSITION, ...arrival.transition }}
      onAnimationComplete={() => {
        if (!isOpening) return;
        setIsOpening(false);
        // Scroll it into view now that it has opened. Smooth here, because nothing else is moving.
        ref.current?.scrollIntoView({
          block: 'nearest',
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
      }}
      // On unpin the card fades and its space closes, so the page below moves up smoothly
      // instead of jumping by the card's height.
      exit={{
        opacity: 0,
        height: 0,
        marginTop: 0,
        overflow: 'hidden',
        transition: { ...COLLAPSE_TRANSITION, opacity: { duration: 0.18 } },
      }}
    >
      {/* The label fades in after the card has landed, so it never flies in with the card. */}
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
        layoutId={shareCardLayout ? `coaching-card-${pinned.turnId}` : undefined}
        isPinned
        onTogglePin={onUnpin}
        onAskNextStep={onAskNextStep}
        unfold={false}
      />
    </motion.section>
  );
};

export default PinnedAnswer;
