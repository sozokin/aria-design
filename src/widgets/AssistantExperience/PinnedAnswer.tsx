import { useEffect, useRef, useState, type FC as ReactFC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Pin } from 'lucide-react';

import CoachingCard from './CoachingCard';

import { COLLAPSE_TRANSITION, EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { IPinnedAnswer } from './AssistantExperience.types';

/** Seconds after the pin lands before the card shows, when it does not glide in: time for the page's
 * scroll towards its slot to be most of the way there. */
const ARRIVE_DELAY = 0.3;

/** DOM id of one pinned card, so the Pinned list can jump to it. */
export const pinnedAnswerId = (turnId: string) => `pinned-answer-${turnId}`;

/** A coaching card once it has settled into the dashboard. Several can stack, newest first. */
const PinnedAnswer: ReactFC<IPinnedAnswer> = ({
  pinned,
  shareCardLayout,
  onUnpin,
  onAskNextStep,
}) => {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  // A restored card is clipped while its room opens, so the card does not show through the gap.
  const [isOpening, setIsOpening] = useState(Boolean(pinned.restored));

  // Pinning moves the card out from under the pointer, so focus follows it. A restored card has
  // no height yet; it is brought into view once it has opened.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    if (!pinned.restored) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [pinned.restored]);

  // How the card arrives. Put back by an undo, it reopens in place at the pace its room closed:
  // the unpin run backwards. Pinned, it glides in from the panel on desktop; on mobile, without
  // the glide, it rises into its slot as the page's scroll towards it settles.
  const arrival = pinned.restored
    ? {
        initial: { height: 0, marginTop: 0, opacity: 0 },
        // 1.75rem is the resting mt-7.
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
      // When content above it leaves (the team overview collapsing, another card unpinned), glide rather than jump.
      layout="position"
      {...arrival}
      transition={{ layout: COLLAPSE_TRANSITION, ...arrival.transition }}
      onAnimationComplete={() => {
        if (!isOpening) return;
        setIsOpening(false);
        // Explicit: the desktop column scrolls instantly, and there is no glide here to cover that.
        ref.current?.scrollIntoView({
          block: 'nearest',
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
      }}
      // Unpinned, the card fades and its room closes, so the page below shortens at the same pace
      // instead of snapping up by the card's height.
      exit={{
        opacity: 0,
        height: 0,
        marginTop: 0,
        overflow: 'hidden',
        transition: { ...COLLAPSE_TRANSITION, opacity: { duration: 0.18 } },
      }}
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
