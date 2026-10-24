import { type FC as ReactFC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { PanelRightClose } from 'lucide-react';

import { Button } from '@/components/ui/button';
import TeamOverview from '.';

import { MOBILE_RAIL_ID } from '@/hooks/useRailCollapse';
import { COLLAPSE_FLIGHT_EASE, COLLAPSE_TRANSITION, EASE_OUT, LOAD_IN, loadIn } from '@/lib/motion';

import { ICollapseFlight } from '@/types/layout.types';
import { IInlineTeamOverview } from './TeamOverview.types';

/**
 * The team overview as it first appears on mobile: inline under the brief. Collapsing it is a
 * one-way move into the drawer: the block shrinks and travels, still solid, to the toggle's spot
 * and fades only in the last part of the trip. Its slot closes over the same time, so whatever
 * sits below glides rather than jumps. The flight itself is measured by useRailCollapse and handed
 * in through AnimatePresence's `custom` prop.
 */
const InlineTeamOverview: ReactFC<IInlineTeamOverview> = ({
  ref,
  pinned,
  onJumpToPinned,
  onCollapse,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className="mt-8"
      // When the brief's suggested next step above it changes length, glide rather than jump.
      layout="position"
      transition={{ layout: { duration: 0.32, ease: EASE_OUT } }}
      variants={{ exit: { height: 0, marginTop: 0, transition: COLLAPSE_TRANSITION } }}
      exit="exit"
    >
      <motion.section
        id={MOBILE_RAIL_ID}
        aria-label="Team overview and pinned answers"
        className="flex flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-xs"
        style={{ transformOrigin: 'center' }}
        // First paint: the card fades in after the brief, and its contents follow inside it.
        {...loadIn(LOAD_IN.rail)}
        variants={{
          exit: (flight: ICollapseFlight | null) =>
            flight && !reduceMotion
              ? {
                  x: flight.dx,
                  y: flight.dy,
                  scaleX: flight.scaleX,
                  scaleY: flight.scaleY,
                  opacity: [1, 1, 0],
                  transition: {
                    // Position and shrink share one curve, so the block never pokes past the
                    // screen edge on its way to the toggle.
                    ...COLLAPSE_TRANSITION,
                    ease: COLLAPSE_FLIGHT_EASE,
                    // Linear: an ease here is applied to the whole timeline, which would reach the
                    // 85% hold point after only about a quarter of the time and fade the block early.
                    opacity: {
                      duration: COLLAPSE_TRANSITION.duration,
                      times: [0, 0.85, 1],
                      ease: 'linear',
                    },
                  },
                }
              : { opacity: 0, transition: { duration: 0.3 } },
        }}
        exit="exit"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[0.8125rem] font-semibold text-tertiary-foreground">Team overview</h2>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="-mr-1.5 text-text-secondary"
            onClick={onCollapse}
          >
            <PanelRightClose data-icon="inline-start" aria-hidden="true" />
            Collapse
            <span className="sr-only"> into the side menu</span>
          </Button>
        </div>
        <TeamOverview pinned={pinned} onJumpToPinned={onJumpToPinned} variant="inline" />
      </motion.section>
    </motion.div>
  );
};

export default InlineTeamOverview;
