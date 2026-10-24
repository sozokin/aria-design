import { useRef, useState, type FC as ReactFC } from 'react';
import { motion } from 'motion/react';
import { PanelRightOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import TeamOverview from '.';

import { RAIL_TOGGLE_ID } from '@/hooks/useRailCollapse';
import { COLLAPSE_TRANSITION, EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { ITeamOverviewDrawer } from './TeamOverview.types';

// The ring starts just before the collapsing block lands on the toggle.
const RING_DELAY = COLLAPSE_TRANSITION.duration - 0.1;
const RING_DURATION = 0.5;

/**
 * Where the team overview lives on mobile once it has collapsed: a toggle fixed beside the
 * greeting that opens the overview in a sheet from the right. The toggle appears as the collapsing
 * block lands on it, with a ring pulsing out to mark where the block went.
 */
const TeamOverviewDrawer: ReactFC<ITeamOverviewDrawer> = ({
  anchor,
  surfaced,
  pinned,
  onJumpToPinned,
  onToggleShown,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // A pinned card chosen inside the sheet is jumped to once the sheet has closed.
  const pendingJump = useRef<string | null>(null);

  const pinnedCount = pinned.length;
  const toggleLabel =
    pinnedCount > 0
      ? `Open team overview, ${pinnedCount} pinned ${pinnedCount === 1 ? 'answer' : 'answers'}`
      : 'Open team overview';

  const jumpAfterClose = (turnId: string) => {
    pendingJump.current = turnId;
    setIsOpen(false);
  };

  return (
    <motion.div className="fixed z-[8] rounded-lg" style={{ top: anchor.top, right: anchor.right }}>
      {/* The ring that pulses out as the block lands. */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-lg bg-accent-muted ring-[3px] ring-accent"
        initial={{ opacity: 0, scale: 1 }}
        // The scale is one segment, so its ease-out decelerates once and never stalls and restarts
        // (easing over several keyframes applies per segment). The opacity starts at 0, because a
        // keyframe array shows its first value during the delay, steps to 0.8 the moment the block
        // lands, then eases out to nothing.
        animate={{ opacity: [0, 0.8, 0], scale: 2.4 }}
        transition={{
          delay: RING_DELAY,
          duration: RING_DURATION,
          ease: EASE_OUT,
          opacity: {
            delay: RING_DELAY,
            duration: RING_DURATION,
            times: [0, 0.02, 1],
            ease: EASE_OUT,
          },
        }}
      />
      {/* The icon waits until the collapsing block has almost arrived, so it does not scale down with it. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: COLLAPSE_TRANSITION.duration * 0.6, duration: 0.3 }}
        onAnimationComplete={onToggleShown}
      >
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              id={RAIL_TOGGLE_ID}
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                'relative text-text-secondary transition-[background-color,box-shadow] duration-200',
                surfaced ? 'bg-popover shadow-sm ring-1 ring-border' : '',
              )}
              aria-label={toggleLabel}
            >
              <PanelRightOpen aria-hidden="true" />
              {pinnedCount > 0 && (
                <span
                  className="absolute top-1 right-1 size-1.5 rounded-full bg-accent"
                  aria-hidden="true"
                />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            // The same data-[side] selector as the sheet's default width, so this one can override it.
            className="overflow-y-auto data-[side=right]:w-[min(22rem,88vw)]"
            aria-describedby={undefined}
            onCloseAutoFocus={event => {
              const turnId = pendingJump.current;
              if (!turnId) return;
              // Land on the card instead of back on the toggle.
              event.preventDefault();
              pendingJump.current = null;
              onJumpToPinned(turnId);
            }}
          >
            <SheetHeader className="pb-0">
              <SheetTitle className="sr-only">Dashboard</SheetTitle>
              <SheetDescription>Today · Friday, September 4</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4 pb-6">
              <TeamOverview pinned={pinned} onJumpToPinned={jumpAfterClose} variant="drawer" />
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>
    </motion.div>
  );
};

export default TeamOverviewDrawer;
